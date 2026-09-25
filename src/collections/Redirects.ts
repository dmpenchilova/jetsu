/**
 * Редиректы: старый адрес → новый. Сайт проверяет список на каждом запросе (с кэшем на минуту).
 * Когда у опубликованной страницы, публикации или вакансии меняется адрес, редирект создаётся сам.
 */
import type { CollectionConfig, Payload } from 'payload'

import { hasRole, isLoggedIn } from '../access'
import { revalidateFront } from '../lib/revalidate'

/** Путь в едином виде: /путь/ (со слешем в начале и в конце), без домена и параметров. */
export const normalizePath = (value: string) => {
  let v = value.trim()
  try {
    if (/^https?:\/\//i.test(v)) v = new URL(v).pathname
  } catch {
    /* оставляем как есть */
  }
  v = v.split('?')[0].split('#')[0]
  if (!v.startsWith('/')) v = `/${v}`
  if (!v.endsWith('/')) v = `${v}/`
  return v.replace(/\/{2,}/g, '/')
}

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Редирект', plural: 'Редиректы' },
  admin: {
    useAsTitle: 'from',
    group: 'Настройки сайта',
    defaultColumns: ['from', 'to', 'code', 'active', 'updatedAt'],
    listSearchableFields: ['from', 'to'],
    description: 'Перенаправления со старых адресов. Адрес пишите без домена: /about/old/',
  },
  access: { read: isLoggedIn, create: hasRole('admin', 'editor'), update: hasRole('admin', 'editor'), delete: hasRole('admin', 'editor') },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.from) data.from = normalizePath(data.from)
        if (data?.to && !/^https?:\/\//i.test(data.to)) data.to = normalizePath(data.to)
        return data
      },
    ],
    afterChange: [
      async ({ req }) => {
        await revalidateFront(req.payload, ['redirects'])
      },
    ],
    afterDelete: [
      async ({ req }) => {
        await revalidateFront(req.payload, ['redirects'])
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'from', label: 'Откуда', type: 'text', required: true, unique: true, index: true, admin: { width: '45%', placeholder: '/old-page/' } },
        { name: 'to', label: 'Куда', type: 'text', required: true, admin: { width: '55%', placeholder: '/new-page/ или https://…' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'code',
          label: 'Тип',
          type: 'select',
          defaultValue: '301',
          required: true,
          options: [
            { label: '301 — навсегда', value: '301' },
            { label: '302 — временно', value: '302' },
          ],
          admin: { width: '45%' },
        },
        { name: 'active', label: 'Включён', type: 'checkbox', defaultValue: true, admin: { width: '25%' } },
        { name: 'auto', label: 'Создан автоматически', type: 'checkbox', defaultValue: false, admin: { width: '30%', readOnly: true } },
      ],
    },
    { name: 'note', label: 'Комментарий', type: 'text' },
  ],
}

/** Создаёт редирект при смене адреса и убирает зацикливание (новый адрес не должен никуда вести). */
export const autoRedirect = async (payload: Payload, fromPath: string, toPath: string) => {
  const from = normalizePath(fromPath)
  const to = normalizePath(toPath)
  if (from === to) return
  // старые редиректы на прежний адрес ведём сразу на новый
  const chained = await payload.find({ collection: 'redirects', where: { to: { equals: from } }, limit: 100, depth: 0, overrideAccess: true })
  for (const r of chained.docs) {
    if (r.from === to) await payload.delete({ collection: 'redirects', id: r.id, overrideAccess: true })
    else await payload.update({ collection: 'redirects', id: r.id, data: { to }, overrideAccess: true })
  }
  // если на новый адрес был редирект — он больше не нужен
  await payload.delete({ collection: 'redirects', where: { from: { equals: to } }, overrideAccess: true })
  const existing = await payload.find({ collection: 'redirects', where: { from: { equals: from } }, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs[0]) {
    await payload.update({ collection: 'redirects', id: existing.docs[0].id, data: { to, active: true }, overrideAccess: true })
  } else {
    await payload.create({ collection: 'redirects', data: { from, to, code: '301', active: true, auto: true, note: 'Адрес изменился' }, overrideAccess: true })
  }
}
