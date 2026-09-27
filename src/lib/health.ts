/**
 * Проверка работоспособности для мониторинга (Uptime Kuma, балансировщик, docker healthcheck).
 *   GET /cms-api/health → 200 {"status":"ok",...} или 503, если не отвечает база.
 * Ответ без личных данных: только состояние и счётчики очереди.
 */
import { sql } from '@payloadcms/db-postgres'
import type { Endpoint, Payload } from 'payload'

const started = Date.now()

export const healthState = async (payload: Payload) => {
  const t0 = Date.now()
  let db = true
  try {
    const adapter = payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }
    await adapter.drizzle.execute(sql`select 1`)
  } catch {
    db = false
  }
  const dbMs = Date.now() - t0
  const failedDeliveries = db
    ? ((await payload.count({ collection: 'submissions', where: { deliveryState: { equals: 'failed' } }, overrideAccess: true }).catch(() => null))?.totalDocs ?? null)
    : null
  const pendingDeliveries = db
    ? ((await payload.count({ collection: 'submissions', where: { deliveryState: { equals: 'pending' } }, overrideAccess: true }).catch(() => null))?.totalDocs ?? null)
    : null
  return {
    status: db ? 'ok' : 'error',
    stand: process.env.STAND_NAME || 'prod',
    uptimeSec: Math.round((Date.now() - started) / 1000),
    db: { ok: db, ms: dbMs },
    deliveries: { failed: failedDeliveries, pending: pendingDeliveries },
  }
}

export const healthEndpoint: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async (req) => {
    const state = await healthState(req.payload)
    return Response.json(state, { status: state.status === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
  },
}
