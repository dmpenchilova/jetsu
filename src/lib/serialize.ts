/**
 * Сборка ответов API в формате, который ждёт фронт jet-front-main.
 */
import type { Payload } from 'payload'

import { blockShapes } from '../blocks'
import { BINDINGS } from '../blocks/bindings'
import type { Shape } from '../blocks/shape'
import { collectFormIds, collectMediaIds, type MediaDoc, toFront, type ToFrontCtx } from '../blocks/transform'
import { formToFront } from '../collections/Forms'

export type Locale = 'ru' | 'en'

type BlockRow = { id?: string | null; blockType: string; hidden?: boolean | null; navTitle?: string | null; hash?: string | null } & Record<string, unknown>

export type PageDoc = {
  id: number | string
  title?: string | null
  path?: string | null
  parent?: number | string | { id: number | string } | null
  content?: BlockRow[] | null
  breadcrumbs?: { show?: boolean | null; variant?: string | null; title?: string | null } | null
  seo?: { title?: string | null; description?: string | null; keywords?: string | null; robots?: string | null; image?: unknown } | null
}

/** Адрес файла для фронта: абсолютный, чтобы фронт мог взять его с домена админки. */
export const fileUrl = (doc: MediaDoc) => {
  if (!doc.url) return undefined
  if (/^https?:\/\//.test(doc.url)) return doc.url
  const base = (process.env.MEDIA_PUBLIC_URL || process.env.SERVER_URL || '').replace(/\/$/, '')
  return `${base}${doc.url}`
}

/** Загружает одним запросом все файлы и формы, на которые ссылаются данные. */
export const buildCtx = async (
  payload: Payload,
  items: { shape: Shape; value: unknown }[],
  locale: Locale,
  extraMedia: unknown[] = [],
): Promise<ToFrontCtx> => {
  const mediaIds = new Set<string>()
  const formIds = new Set<string>()
  for (const { shape, value } of items) {
    collectMediaIds(shape, value, mediaIds)
    collectFormIds(shape, value, formIds)
  }
  for (const m of extraMedia) {
    const id = m && typeof m === 'object' ? (m as { id?: unknown }).id : m
    if (id !== null && id !== undefined && id !== '') mediaIds.add(String(id))
  }
  const media = new Map<string, MediaDoc>()
  if (mediaIds.size) {
    const res = await payload.find({
      collection: 'media',
      // alt у файла на каждом языке свой
      locale,
      where: { id: { in: [...mediaIds] } },
      limit: mediaIds.size,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    for (const d of res.docs) media.set(String(d.id), d as MediaDoc)
  }
  const forms = new Map<string, unknown>()
  if (formIds.size) {
    const res = await payload.find({
      collection: 'forms',
      where: { id: { in: [...formIds] } },
      limit: formIds.size,
      depth: 0,
      pagination: false,
      locale,
      overrideAccess: true,
    })
    for (const d of res.docs) forms.set(String(d.id), formToFront(d))
  }
  return { media, forms, fileUrl }
}

/** Блоки страницы в формате фронта. Скрытые и пустые блоки не отдаются. */
/** Блок показывается по расписанию «с — по». */
const inWindow = (row: BlockRow, now = Date.now()) => {
  const from = row.showFrom ? new Date(String(row.showFrom)).getTime() : -Infinity
  const until = row.showUntil ? new Date(String(row.showUntil)).getTime() : Infinity
  return now >= from && now <= until
}

/** Оформление блока для фронта: только то, что отличается от макета. */
const viewOf = (row: BlockRow) => {
  const view: Record<string, string> = {}
  if (row.viewBg && row.viewBg !== 'default') view.bg = String(row.viewBg)
  if (row.viewSpaceTop && row.viewSpaceTop !== 'default') view.spaceTop = String(row.viewSpaceTop)
  if (row.viewSpaceBottom && row.viewSpaceBottom !== 'default') view.spaceBottom = String(row.viewSpaceBottom)
  if (row.viewDevice && row.viewDevice !== 'all') view.device = String(row.viewDevice)
  return Object.keys(view).length ? view : undefined
}

export const blocksToFront = (rows: BlockRow[], ctx: ToFrontCtx) =>
  rows
    .filter((row) => !row.hidden && blockShapes[row.blockType] && inWindow(row))
    .map((row) => {
      const data = (toFront(blockShapes[row.blockType], row, ctx) ?? {}) as Record<string, unknown>
      delete data.hidden
      if (row.navTitle) data.navTitle = row.navTitle
      if (row.hash) data.hash = row.hash
      const view = viewOf(row)
      return { type: row.blockType, uuid: String(row.id ?? ''), data, ...(view ? { view } : {}) }
    })
    .filter((b) => Object.keys(b.data).length > 0)

const idOf = (p: PageDoc['parent']) => (p && typeof p === 'object' ? p.id : p) ?? null

/** Хлебные крошки: предки со ссылками и текущая страница без ссылки. Главную фронт добавляет сам. */
const breadcrumbsOf = async (payload: Payload, page: PageDoc, locale: Locale) => {
  if (page.breadcrumbs?.show === false || !page.path) return undefined
  const chain: { title: string; url?: string }[] = []
  let pid = idOf(page.parent)
  for (let guard = 0; pid && guard < 10; guard += 1) {
    const parent = (await payload.findByID({ collection: 'pages', id: pid, depth: 0, locale, overrideAccess: true }).catch(() => null)) as PageDoc | null
    if (!parent) break
    if (parent.path) chain.unshift({ title: parent.title ?? '', url: `/${parent.path}/` })
    pid = idOf(parent.parent)
  }
  chain.push({ title: page.breadcrumbs?.title || page.title || '' })
  const out: Record<string, unknown> = { items: chain }
  if (page.breadcrumbs?.variant && page.breadcrumbs.variant !== 'default') out.variant = page.breadcrumbs.variant
  return out
}

export const seoOf = (page: PageDoc, ctx: ToFrontCtx) => {
  const seo: Record<string, string> = {}
  const title = page.seo?.title || page.title
  if (title) seo.title = title
  if (page.seo?.description) seo.description = page.seo.description
  if (page.seo?.keywords) seo.keywords = page.seo.keywords
  if (page.seo?.robots) seo.robots = page.seo.robots
  const img = page.seo?.image
  const imgId = img && typeof img === 'object' ? String((img as { id: unknown }).id) : img ? String(img) : ''
  const doc = imgId ? ctx.media.get(imgId) : undefined
  const url = doc ? fileUrl(doc) : undefined
  if (url) seo.images = url
  return seo
}

const topicsOf = (page: PageDoc) => {
  const t = (page as { topics?: { directions?: unknown[]; industries?: unknown[] } }).topics
  const list = (v?: unknown[]) => (v ?? []).map((x) => String(x && typeof x === 'object' ? (x as { id: unknown }).id : x))
  return { directions: list(t?.directions), industries: list(t?.industries) }
}

export const pageToFront = async (payload: Payload, page: PageDoc, locale: Locale) => {
  // «Общие блоки» разворачиваются в своё содержимое
  const { expandShared } = await import('../collections/Library')
  const expanded = (await expandShared(payload, (page.content ?? []) as never, locale)) as unknown as BlockRow[]
  const rows = expanded.filter((r) => blockShapes[r.blockType])
  const ctx = await buildCtx(
    payload,
    rows.map((r) => ({ shape: blockShapes[r.blockType], value: r })),
    locale,
    [page.seo?.image],
  )
  const data: Record<string, unknown> = {}
  const breadcrumbs = await breadcrumbsOf(payload, page, locale)
  if (breadcrumbs) data.breadcrumbs = breadcrumbs
  data.seo = seoOf(page, ctx)
  // лендинг: сайт прячет меню в шапке и футер
  if ((page as { layout?: string }).layout === 'landing') data.layout = 'landing'
  const content = blocksToFront(rows, ctx)
  // блоки, которые берут записи из коллекций
  const { resolveBinding } = await import('./lists')
  for (const block of content) {
    const row = rows.find((r) => String(r.id ?? '') === block.uuid)
    const binding = BINDINGS[block.type]
    if (!row || !binding) continue
    const items = await resolveBinding(payload, block.type, row, locale, topicsOf(page))
    if (items !== undefined) {
      if (binding.single) {
        if (items.length) block.data[binding.prop] = items[0]
      } else block.data[binding.prop] = items
    }
  }
  // опросы — отдельные блоки со своими данными; ставим их на свои места среди остальных
  const polls = expanded.filter((r) => r.blockType === 'poll' && !r.hidden)
  if (polls.length) {
    const { pollToFront } = await import('../collections/Polls')
    const pollBlocks = new Map<string, Record<string, unknown>>()
    for (const r of polls) {
      const id = r.ref && typeof r.ref === 'object' ? (r.ref as { id: number }).id : (r.ref as number)
      const d = id ? await pollToFront(payload, id, locale, (r.tag as string) || undefined) : undefined
      if (d) pollBlocks.set(String(r.id ?? ''), d)
    }
    const ordered: typeof content = []
    const byUuid = new Map(content.map((b) => [b.uuid, b]))
    for (const r of expanded) {
      const uuid = String(r.id ?? '')
      if (r.blockType === 'poll') {
        const d = pollBlocks.get(uuid)
        if (d) ordered.push({ type: 'poll', uuid, data: d })
      } else if (byUuid.has(uuid)) ordered.push(byUuid.get(uuid)!)
    }
    data.content = ordered
  } else data.content = content
  return { status: 'success', data }
}

/** Ответ по структуре из схем фронта (хедер, футер, 404, попап). */
export const shapeToFront = async (payload: Payload, shape: Shape, value: unknown, locale: Locale) => {
  const ctx = await buildCtx(payload, [{ shape, value }], locale)
  return toFront(shape, value, ctx)
}
