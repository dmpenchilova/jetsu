/**
 * Где используется файл медиатеки: проходит по всем разделам и настройкам сайта
 * (включая блоки конструктора на обоих языках) и находит ссылки на файл.
 */
import type { Field, Payload } from 'payload'

export type Usage = { where: string; field: string; href: string }

const SKIP_COLLECTIONS = new Set(['media', 'submission-files', 'search-index', 'search-queries', 'audit-log', 'submissions', 'redirects', 'users', 'payload-jobs', 'payload-locked-documents', 'payload-preferences', 'payload-migrations', 'payload-folders'])

const labelOf = (f: { label?: unknown; name?: string }) => (typeof f.label === 'string' ? f.label : f.name ?? '')

const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id?: unknown }).id : v)

/** Ищет в данных поля типа upload, которые ссылаются на файл, и возвращает пути (подписями полей). */
const walk = (fields: Field[], data: unknown, target: string, trail: string[], out: string[], blocksBySlug: Map<string, { fields: Field[]; label: string }>) => {
  if (!data || typeof data !== 'object') return
  const obj = data as Record<string, unknown>
  for (const field of fields) {
    if (field.type === 'row' || field.type === 'collapsible') {
      walk(field.fields, obj, target, trail, out, blocksBySlug)
      continue
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) walk(tab.fields, 'name' in tab && tab.name ? obj[tab.name] : obj, target, trail, out, blocksBySlug)
      continue
    }
    if (!('name' in field) || !field.name) continue
    let value = obj[field.name]
    if (value === undefined || value === null) continue
    const values: unknown[] = []
    // локализованные поля приходят объектом { ru, en }
    if ('localized' in field && field.localized && typeof value === 'object' && !Array.isArray(value) && ('ru' in (value as object) || 'en' in (value as object))) {
      values.push(...Object.values(value as object))
    } else values.push(value)
    const here = [...trail, labelOf(field as { label?: unknown; name?: string })]
    for (value of values) {
      if (value === undefined || value === null) continue
      switch (field.type) {
        case 'upload':
          if ((Array.isArray(value) ? value : [value]).some((v) => String(idOf(v)) === target)) out.push(here.join(' → '))
          break
        case 'group':
          walk(field.fields, value, target, here, out, blocksBySlug)
          break
        case 'array':
          if (Array.isArray(value)) value.forEach((row) => walk(field.fields, row, target, here, out, blocksBySlug))
          break
        case 'blocks':
          if (Array.isArray(value)) {
            for (const row of value) {
              const type = (row as { blockType?: string })?.blockType ?? ''
              const block = (field.blocks ?? []).find((b) => b.slug === type)
              const name = block ? (typeof block.labels?.singular === 'string' ? block.labels.singular : type) : type
              if (block) walk(block.fields, row, target, [...trail, `Блок «${name}»`], out, blocksBySlug)
            }
          }
          break
        default:
          break
      }
    }
  }
}

const hasUpload = (fields: Field[]): boolean =>
  fields.some((f) => {
    if (f.type === 'upload') return true
    if (f.type === 'tabs') return f.tabs.some((t) => hasUpload(t.fields))
    if ('fields' in f && Array.isArray(f.fields)) return hasUpload(f.fields as Field[])
    if (f.type === 'blocks') return (f.blocks ?? []).some((b) => hasUpload(b.fields))
    return false
  })

export const findMediaUsage = async (payload: Payload, mediaId: number | string): Promise<Usage[]> => {
  const target = String(mediaId)
  const usages: Usage[] = []
  const blocksBySlug = new Map<string, { fields: Field[]; label: string }>()

  for (const collection of payload.config.collections) {
    if (SKIP_COLLECTIONS.has(collection.slug) || !hasUpload(collection.fields)) continue
    const label = typeof collection.labels?.singular === 'string' ? collection.labels.singular : collection.slug
    const res = await payload.find({
      collection: collection.slug as 'pages',
      locale: 'all' as 'ru',
      depth: 0,
      limit: 5000,
      pagination: false,
      overrideAccess: true,
    })
    for (const doc of res.docs as unknown as Record<string, unknown>[]) {
      const found: string[] = []
      walk(collection.fields, doc, target, [], found, blocksBySlug)
      if (!found.length) continue
      const title = doc.title && typeof doc.title === 'object' ? (doc.title as Record<string, string>).ru : doc.title
      const name = String(title ?? doc.id).replace(/<[^>]+>/g, '')
      for (const field of [...new Set(found)]) {
        usages.push({ where: `${label} «${name}»`, field, href: `/admin/collections/${collection.slug}/${doc.id}` })
      }
    }
  }

  for (const global of payload.config.globals) {
    if (!hasUpload(global.fields)) continue
    const doc = await payload.findGlobal({ slug: global.slug as 'header', locale: 'all' as 'ru', depth: 0, overrideAccess: true }).catch(() => null)
    if (!doc) continue
    const found: string[] = []
    walk(global.fields, doc, target, [], found, blocksBySlug)
    const label = typeof global.label === 'string' ? global.label : global.slug
    for (const field of [...new Set(found)]) usages.push({ where: `Настройки «${label}»`, field, href: `/admin/globals/${global.slug}` })
  }
  return usages
}
