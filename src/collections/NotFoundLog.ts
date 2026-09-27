/**
 * Журнал 404: какие несуществующие адреса открывают посетители. Отсюда удобно делать редиректы.
 * Сайт сообщает о 404 сам (POST /api/not-found/).
 */
import type { CollectionConfig, Payload } from 'payload'

import { hasRole } from '../access'

export const NotFoundLog: CollectionConfig = {
  slug: 'not-found-log',
  labels: { singular: 'Адрес 404', plural: 'Ошибки 404' },
  admin: {
    useAsTitle: 'path',
    group: 'Настройки сайта',
    defaultColumns: ['path', 'hits', 'lastSeen', 'referrer', 'fixed'],
    description: 'Несуществующие адреса, которые открывали посетители. Частые стоит перенаправить: откройте адрес и нажмите «Сделать редирект». Хранятся 90 дней',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: '-hits',
  access: { read: hasRole('admin', 'editor'), create: () => false, update: hasRole('admin', 'editor'), delete: hasRole('admin', 'editor') },
  fields: [
    { name: 'path', label: 'Адрес', type: 'text', unique: true, index: true, admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'hits', label: 'Сколько раз', type: 'number', defaultValue: 0, index: true, admin: { readOnly: true, width: '25%' } },
        { name: 'lastSeen', label: 'Последний раз', type: 'date', index: true, admin: { readOnly: true, width: '35%', date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'fixed', label: 'Есть редирект', type: 'checkbox', admin: { readOnly: true, width: '40%' } },
      ],
    },
    { name: 'referrer', label: 'Откуда пришли (последний)', type: 'text', admin: { readOnly: true } },
    { name: 'makeRedirect', type: 'ui', admin: { components: { Field: '/components/NotFoundRedirect#NotFoundRedirect' } } },
  ],
}

const recent = new Map<string, number>()

/** Учёт 404: один адрес от одного посетителя — не чаще раза в минуту. */
export const logNotFound = async (payload: Payload, input: { path?: unknown; referrer?: unknown }, ipKey: string) => {
  const raw = typeof input.path === 'string' ? input.path : ''
  if (!raw.startsWith('/') || raw.length > 300) return
  const path = raw.split(/[?#]/)[0]
  if (/^\/(_next|api|preview|static)\//.test(path) || /\.(php|env|git|asp|jsp|cgi)/i.test(path)) return
  const key = `${ipKey}:${path}`
  const now = Date.now()
  if ((recent.get(key) ?? 0) > now - 60_000) return
  recent.set(key, now)
  if (recent.size > 5000) for (const [k, t] of recent) if (t < now - 60_000) recent.delete(k)
  const referrer = typeof input.referrer === 'string' ? input.referrer.slice(0, 300) : ''
  const existing = await payload.find({ collection: 'not-found-log', where: { path: { equals: path } }, limit: 1, depth: 0, overrideAccess: true })
  const doc = existing.docs[0] as { id: number; hits?: number } | undefined
  if (doc) {
    await payload.update({ collection: 'not-found-log', id: doc.id, data: { hits: (doc.hits ?? 0) + 1, lastSeen: new Date().toISOString(), ...(referrer ? { referrer } : {}) }, overrideAccess: true })
  } else {
    // не даём журналу разрастись от сканеров
    const { totalDocs } = await payload.count({ collection: 'not-found-log', overrideAccess: true })
    if (totalDocs > 20_000) return
    await payload.create({ collection: 'not-found-log', data: { path, hits: 1, lastSeen: new Date().toISOString(), referrer }, overrideAccess: true })
  }
}
