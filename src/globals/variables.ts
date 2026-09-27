/**
 * Переменные сайта: телефон, адрес, «30 лет на рынке» и т. п.
 * В любом тексте пишется {{телефон}} — на сайте подставится значение. Поменяли здесь — обновилось везде.
 */
import type { GlobalConfig, Payload } from 'payload'

import { hasRole, isLoggedIn } from '../access'
import { revalidateFront } from '../lib/revalidate'

export const SiteVariables: GlobalConfig = {
  slug: 'site-variables',
  label: 'Переменные',
  admin: {
    group: 'Настройки сайта',
    description: 'В тексте на сайте пишите {{имя}}, например {{телефон}} — подставится значение. Для английской версии значение задаётся отдельно (переключите язык вверху)',
  },
  access: { read: isLoggedIn, update: hasRole('admin', 'editor') },
  hooks: {
    afterChange: [
      async ({ req }) => {
        // переменные могут стоять где угодно — сбрасываем весь кэш сайта
        await revalidateFront(req.payload, ['revalidate'])
      },
    ],
  },
  fields: [
    {
      name: 'items',
      label: 'Переменные',
      type: 'array',
      labels: { singular: 'переменная', plural: 'Переменные' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'key',
              label: 'Имя',
              type: 'text',
              required: true,
              admin: { width: '30%', description: 'Без скобок: телефон, адрес, лет_на_рынке' },
              validate: (v: string | null | undefined) => !v || /^[\p{L}\p{N}_-]+$/u.test(v) || 'Буквы, цифры, _ и -',
            },
            { name: 'value', label: 'Значение', type: 'text', localized: true, admin: { width: '50%' } },
            { name: 'note', label: 'Где используется', type: 'text', admin: { width: '20%' } },
          ],
        },
      ],
    },
  ],
}

const VAR = /\{\{\s*([\p{L}\p{N}_-]+)\s*\}\}/gu

/** Подставляет значения переменных во все строки ответа. */
export const applyVariables = async <T>(payload: Payload, body: T, locale: 'ru' | 'en'): Promise<T> => {
  const json = JSON.stringify(body)
  if (!json.includes('{{')) return body
  const doc = (await payload.findGlobal({ slug: 'site-variables', locale, depth: 0, overrideAccess: true }).catch(() => null)) as {
    items?: { key?: string; value?: string | null }[]
  } | null
  const map = new Map((doc?.items ?? []).filter((i) => i.key).map((i) => [String(i.key).toLowerCase(), i.value ?? '']))
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return v.includes('{{') ? v.replace(VAR, (m, k: string) => (map.has(k.toLowerCase()) ? String(map.get(k.toLowerCase())) : m)) : v
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, walk(x)]))
    return v
  }
  return walk(body) as T
}
