/**
 * Индекс поиска по сайту. Каждая опубликованная страница, публикация и вакансия
 * превращается в запись: тип, заголовок, чистый текст, адрес, теги — отдельно для RU и EN.
 * Индекс обновляется при публикации и снятии с публикации; полная пересборка — npm run search:reindex.
 */
import type { Payload, PayloadRequest } from 'payload'

import type { SearchType } from '../../collections/Search'

type Locale = 'ru' | 'en'
type Doc = Record<string, unknown>
type Tag = { title: string; url?: string }

const LOCALES: Locale[] = ['ru', 'en']

/** Ключи с текстом, который стоит искать. Адреса, картинки, служебные поля пропускаем. */
const SKIP_KEYS = new Set([
  'id', 'blockType', 'blockName', 'hidden', 'hash', 'navTitle', 'url', 'href', 'link', 'src', 'video', 'image', 'img',
  'background', 'icon', 'color', 'variant', 'slug', 'code', 'form', 'mobile', 'tablet', 'desktop', 'alt', 'source',
  'limit', 'pick', 'type', 'size', 'theme', 'target', 'btn', 'hashToScroll',
])

const stripHtml = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|li|h\d)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/[\s ]+/g, ' ')
    .trim()

const looksTechnical = (s: string) => /^(https?:|\/|#|mailto:|tel:)/.test(s) || /^[a-z0-9_-]+$/.test(s) || /\.(png|jpe?g|webp|svg|mp4|pdf)$/i.test(s)

/** Собирает весь видимый текст из данных (блоков конструктора, разделов вакансии и т. п.). */
export const collectText = (value: unknown, out: string[] = [], depth = 0): string[] => {
  if (depth > 12 || value === null || value === undefined) return out
  if (typeof value === 'string') {
    const t = stripHtml(value)
    if (t && !looksTechnical(t)) out.push(t)
  } else if (Array.isArray(value)) {
    for (const v of value) collectText(v, out, depth + 1)
  } else if (typeof value === 'object') {
    const obj = value as Doc
    if (obj.hidden === true) return out
    for (const [k, v] of Object.entries(obj)) if (!SKIP_KEYS.has(k)) collectText(v, out, depth + 1)
  }
  return out
}

/** Тип страницы конструктора по адресу, если в странице не указан явно. */
export const pageTypeByPath = (path: string): SearchType => {
  if (/^(services|directions?)(\/|$)/.test(path)) return 'service'
  if (/(^|\/)(industr|otrasl)/.test(path)) return 'industry'
  if (/^(career|vacanc|internship|jobs)/.test(path)) return 'career'
  if (/^(project|cases)/.test(path)) return 'project'
  if (/^(about|history|contacts|company|policy|partners)/.test(path) || path === '') return 'company'
  return 'other'
}

const urlOf = (path: string, locale: Locale) => `${locale === 'en' ? '/en' : ''}/${path}${path ? '/' : ''}`.replace(/\/{2,}/g, '/')

type Entry = { type: SearchType; title: string; text: string; url: string; tags?: Tag[]; date?: string | null }

const titleText = (v: unknown) => (typeof v === 'string' ? stripHtml(v) : '')

/** Справочники для подписей тегов: направления, отрасли, теги. */
const loadLookups = async (payload: Payload, locale: Locale) => {
  const map = async (collection: 'directions' | 'industries' | 'terms') => {
    const res = await payload.find({ collection, locale, depth: 0, limit: 1000, pagination: false, overrideAccess: true })
    return new Map(res.docs.map((d) => [String(d.id), d as unknown as Doc]))
  }
  const [directions, industries, terms] = await Promise.all([map('directions'), map('industries'), map('terms')])
  return { directions, industries, terms }
}
type Lookups = Awaited<ReturnType<typeof loadLookups>>

const idsOf = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x && typeof x === 'object' ? (x as Doc).id : x)) : [])

const pageEntry = (doc: Doc, locale: Locale): Entry | null => {
  const path = String(doc.path ?? '')
  const explicit = String(doc.searchType ?? 'auto')
  if (explicit === 'hidden') return null
  const seo = doc.seo as { robots?: string } | undefined
  if (seo?.robots && /noindex/.test(seo.robots)) return null
  const title = titleText(doc.title)
  if (!title) return null
  return {
    type: explicit === 'auto' ? pageTypeByPath(path) : (explicit as SearchType),
    title,
    text: collectText(doc.content).join(' '),
    url: urlOf(path, locale),
  }
}

const publicationEntry = (doc: Doc, locale: Locale, lk: Lookups): Entry | null => {
  const title = titleText(doc.title)
  if (!title || !doc.slug) return null
  const tags: Tag[] = []
  for (const id of idsOf(doc.directions)) {
    const d = lk.directions.get(id)
    if (d?.title) tags.push({ title: titleText(d.title), url: `${locale === 'en' ? '/en' : ''}/expertise/?direction=${d.code}` })
  }
  for (const id of idsOf(doc.industries)) {
    const d = lk.industries.get(id)
    if (d?.title) tags.push({ title: titleText(d.title), url: `${locale === 'en' ? '/en' : ''}/expertise/?industry=${d.code}` })
  }
  for (const id of idsOf(doc.universal)) {
    const d = lk.terms.get(id)
    if (d?.title) tags.push({ title: titleText(d.title) })
  }
  const type: SearchType = doc.type === 'article' ? 'article' : doc.type === 'journal' ? 'journal' : 'news'
  return {
    type,
    title,
    text: [titleText(doc.description), ...collectText(doc.body)].join(' '),
    url: urlOf(`expertise/${doc.slug}`, locale),
    tags,
    date: (doc.date as string) ?? null,
  }
}

const vacancyEntry = (doc: Doc, locale: Locale, lk: Lookups): Entry | null => {
  const title = titleText(doc.title)
  if (!title || !doc.slug) return null
  const section = doc.kind === 'internship' ? 'internships' : 'vacancies'
  const tags: Tag[] = []
  for (const id of idsOf(doc.tag ?? doc.tags)) {
    const t = lk.terms.get(id)
    if (t?.title) tags.push({ title: titleText(t.title), url: `${locale === 'en' ? '/en' : ''}/${section}/?tag=${t.code}` })
  }
  const skip = new Set(['title', 'slug', 'kind', '_status', 'id', 'createdAt', 'updatedAt', 'similar', 'closeAt', 'tag', 'tags', 'city', 'experience', 'workFormat'])
  const body = Object.fromEntries(Object.entries(doc).filter(([k]) => !skip.has(k)))
  return { type: 'career', title, text: collectText(body).join(' '), url: urlOf(`${section}/${doc.slug}`, locale), tags, date: (doc.updatedAt as string) ?? null }
}

type Source = 'pages' | 'publications' | 'vacancies'

const entryOf = (collection: Source, doc: Doc, locale: Locale, lk: Lookups) => {
  if (collection === 'pages') return pageEntry(doc, locale)
  if (collection === 'publications') return publicationEntry(doc, locale, lk)
  return vacancyEntry(doc, locale, lk)
}

/** Обновляет записи индекса одного документа (на обоих языках). */
export const indexDoc = async (
  payload: Payload,
  collection: Source,
  id: number | string,
  lookups?: Record<Locale, Lookups>,
  req?: PayloadRequest,
) => {
  const source = `${collection}:${id}`
  await payload.delete({ collection: 'search-index', where: { source: { equals: source } }, overrideAccess: true, req })
  for (const locale of LOCALES) {
    const doc = (await payload
      .findByID({ collection, id, locale, depth: 0, draft: false, overrideAccess: true, req })
      .catch(() => null)) as Doc | null
    if (!doc || doc._status !== 'published') continue
    const lk = lookups?.[locale] ?? (await loadLookups(payload, locale))
    const entry = entryOf(collection, doc, locale, lk)
    if (!entry) continue
    await payload.create({
      collection: 'search-index',
      data: { source, locale, ...entry, text: entry.text.slice(0, 100_000) },
      overrideAccess: true,
      req,
    })
  }
}

export const removeDoc = async (payload: Payload, collection: Source, id: number | string, req?: PayloadRequest) => {
  await payload.delete({ collection: 'search-index', where: { source: { equals: `${collection}:${id}` } }, overrideAccess: true, req })
}

/** Полная пересборка индекса. */
export const reindexAll = async (payload: Payload) => {
  await payload.delete({ collection: 'search-index', where: { id: { exists: true } }, overrideAccess: true })
  const lookups = { ru: await loadLookups(payload, 'ru'), en: await loadLookups(payload, 'en') }
  let count = 0
  for (const collection of ['pages', 'publications', 'vacancies'] as Source[]) {
    const res = await payload.find({ collection, where: { _status: { equals: 'published' } }, depth: 0, limit: 5000, pagination: false, overrideAccess: true, select: {} as never })
    for (const doc of res.docs as unknown as { id: number }[]) {
      await indexDoc(payload, collection, doc.id, lookups)
      count += 1
    }
  }
  return count
}

/** Хуки для коллекций: переиндексация после публикации и удаления. */
export const searchHooks = (collection: Source) => ({
  afterChange: [
    async ({ doc, previousDoc, req }: { doc: Doc; previousDoc?: Doc; req: PayloadRequest }) => {
      // черновики и автосохранение индекс не трогают
      const autosave = String((req.query as Record<string, unknown> | undefined)?.autosave ?? '') === 'true'
      if (!autosave && (doc._status === 'published' || previousDoc?._status === 'published')) {
        try {
          await indexDoc(req.payload, collection, doc.id as number, undefined, req)
        } catch (err) {
          req.payload.logger.error({ err }, 'search index')
        }
      }
      return doc
    },
  ],
  afterDelete: [
    async ({ doc, req }: { doc: Doc; req: PayloadRequest }) => {
      await removeDoc(req.payload, collection, doc.id as number, req)
    },
  ],
})
