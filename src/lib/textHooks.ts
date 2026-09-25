/**
 * Обработка текстов при сохранении: чистка HTML от опасного и типограф.
 * Проходит по всем текстовым полям документа, включая блоки конструктора и вложенные списки.
 */
import type { CollectionBeforeChangeHook, Field, GlobalBeforeChangeHook, PayloadRequest } from 'payload'
import sanitizeHtml from 'sanitize-html'

import { typograph, type TypographOptions } from './typograph'

/** Поля, где лежат адреса, коды и служебные значения — их не трогаем. */
const SKIP_NAMES = new Set([
  'slug', 'code', 'url', 'href', 'link', 'hash', 'email', 'phone', 'path', 'sourcePath', 'filename', 'mimeType',
  'src', 'video', 'icon', 'color', 'variant', 'key', 'name', 'acceptedFileTypes', 'defaultValue', 'target', 'id',
  'blockName', 'robots', 'action', 'recipients', 'cc', 'search', 'summary', 'ipHash', 'embed', 'html', 'code',
])

/** Похоже на адрес, почту или путь — не текст. */
const looksTechnical = (v: string) => /^(https?:|mailto:|tel:|\/|#|www\.)\S*$/i.test(v.trim()) || /^[^\s@]+@[^\s@]+$/.test(v.trim())

const ALLOWED = {
  allowedTags: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'span', 'sup', 'sub', 'h2', 'h3', 'h4', 'blockquote', 'nobr'],
  allowedAttributes: { a: ['href', 'target', 'rel'], span: ['class'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  // сущности оставляем как есть, чтобы не превращать & в &amp; в обычных полях
  parser: { decodeEntities: false },
  transformTags: {
    a: (tagName: string, attribs: Record<string, string>) =>
      attribs.target === '_blank' ? { tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } } : { tagName, attribs },
  },
} satisfies sanitizeHtml.IOptions

export const cleanHtml = (value: string) => (value.includes('<') ? sanitizeHtml(value, ALLOWED) : value)

type Settings = { enabled?: boolean | null; yo?: boolean | null; nbHyphen?: boolean | null }

const loadSettings = async (req: PayloadRequest): Promise<Settings> => {
  // настройки читаем один раз на запрос
  const ctx = req.context as { typographSettings?: Settings }
  if (!ctx.typographSettings) {
    ctx.typographSettings = (await req.payload
      .findGlobal({ slug: 'typograph-settings', depth: 0, overrideAccess: true, req })
      .catch(() => ({ enabled: true }))) as Settings
  }
  return ctx.typographSettings
}

type Fix = (v: string) => string

const walk = (fields: Field[], data: unknown, fix: Fix): unknown => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  const obj = { ...(data as Record<string, unknown>) }
  for (const field of fields) {
    if (field.type === 'row' || field.type === 'collapsible') {
      Object.assign(obj, walk(field.fields, obj, fix))
      continue
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) obj[tab.name] = walk(tab.fields, obj[tab.name], fix)
        else Object.assign(obj, walk(tab.fields, obj, fix))
      }
      continue
    }
    if (!('name' in field) || !field.name || !(field.name in obj)) continue
    const value = obj[field.name]
    if (value === null || value === undefined) continue
    switch (field.type) {
      case 'text':
      case 'textarea':
        if (SKIP_NAMES.has(field.name) || (field.custom as { typograph?: boolean } | undefined)?.typograph === false) break
        if (typeof value === 'string') obj[field.name] = looksTechnical(value) ? value : fix(value)
        else if (Array.isArray(value)) obj[field.name] = value.map((v) => (typeof v === 'string' && !looksTechnical(v) ? fix(v) : v))
        break
      case 'group':
        obj[field.name] = walk(field.fields, value, fix)
        break
      case 'array':
        if (Array.isArray(value)) obj[field.name] = value.map((row) => walk(field.fields, row, fix))
        break
      case 'blocks':
        if (Array.isArray(value)) {
          obj[field.name] = value.map((row) => {
            const type = (row as { blockType?: string })?.blockType
            const block = (field.blocks ?? []).find((b) => b.slug === type)
            return block ? walk(block.fields, row, fix) : row
          })
        }
        break
      default:
        break
    }
  }
  return obj
}

const makeFix = (settings: Settings, locale: string | undefined): Fix => {
  const opts: TypographOptions = { locale: locale === 'en' ? 'en' : 'ru', yo: settings.yo ?? true, nbHyphen: settings.nbHyphen ?? false }
  return (v) => {
    const clean = cleanHtml(v)
    return settings.enabled === false ? clean : typograph(clean, opts)
  }
}

/** Хук коллекции: чистит HTML и типографирует тексты перед сохранением. */
/**
 * Черновики (в том числе автосохранение каждые 2 секунды) не трогаем, чтобы текст
 * не менялся под курсором редактора. Типограф срабатывает при публикации.
 */
const skip = (data: unknown, context: unknown) =>
  (context as { skipTypograph?: boolean } | undefined)?.skipTypograph || (data as { _status?: string } | undefined)?._status === 'draft'

export const textHook: CollectionBeforeChangeHook = async ({ data, req, collection, context }) => {
  if (skip(data, context)) return data
  const settings = await loadSettings(req)
  return walk(collection.fields as Field[], data, makeFix(settings, req.locale ?? undefined)) as typeof data
}

/** То же для глобальных разделов (хедер, футер и т. п.). */
export const globalTextHook: GlobalBeforeChangeHook = async ({ data, req, global, context }) => {
  if (skip(data, context)) return data
  const settings = await loadSettings(req)
  return walk(global.fields as Field[], data, makeFix(settings, req.locale ?? undefined)) as typeof data
}
