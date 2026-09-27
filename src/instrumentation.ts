/**
 * Ошибки сервера админки и API сайта — в оповещения (Telegram / почта, см. src/lib/alerts.ts).
 */
import type { Instrumentation } from 'next'

export const onRequestError: Instrumentation.onRequestError = async (err, request) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const e = err as Error & { digest?: string }
  // служебные «ошибки» Next (redirect, notFound) — не сбои
  if (e?.digest && /^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR)/.test(e.digest)) return
  try {
    const { alertsConfigured, sendAlert } = await import('./lib/alerts')
    if (!alertsConfigured()) return
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config }).catch(() => null)
    const message = e?.message ?? String(err)
    await sendAlert(payload, `admin-error:${message.slice(0, 80)}`, 'ошибка сервера админки', `${request.method} ${request.path}\n${message}\n${(e?.stack ?? '').split('\n').slice(1, 6).join('\n')}`)
  } catch {
    // оповещение не должно ронять ответ
  }
}
