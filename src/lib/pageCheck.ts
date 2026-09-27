/**
 * Проверка страницы перед публикацией: то, что не мешает сохранить, но испортит сайт.
 * — тексты длиннее, чем помещается в макет; мало или много карточек;
 * — картинки без alt; внутренние ссылки на несуществующие страницы;
 * — пустые SEO-поля; нет английской версии.
 */
import type { Payload } from 'payload'

import { blockShapes } from '../blocks'
import { BLOCK_LIMITS, charLimit, patternOf, visibleLength } from '../blocks/limits'
import { BLOCK_META } from '../blocks/meta'
import { nameOf, type Shape } from '../blocks/shape'

export type Issue = { level: 'error' | 'warn'; message: string; block?: string; blockIndex?: number }

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
const idOf = (v: unknown) => (isObj(v) ? v.id : v)

type Ctx = {
  block: string
  index: number
  issues: Issue[]
  media: Map<string, { alt?: string | null }>
  links: string[]
}

const LABELS: Record<string, string> = {
  title: 'заголовок', description: 'описание', text: 'текст', tag: 'надзаголовок', subtitle: 'подзаголовок', subTitle: 'подзаголовок',
  items: 'карточки', img: 'картинка', image: 'картинка', background: 'фон', company: 'логотипы', stats: 'цифры', socials: 'соцсети', tags: 'теги',
  suptitle: 'надзаголовок', label: 'подпись', navTitle: 'название в навигации',
}
const human = (path: string) => {
  const parts = path.split('.').filter((p) => !/^\d+$/.test(p))
  const last = parts[parts.length - 1] ?? path
  const row = path.match(/\.(\d+)\./)
  return `${LABELS[last] ?? last}${row ? ` (карточка ${Number(row[1]) + 1})` : ''}`
}

const walk = (shape: Shape, value: unknown, path: string, ctx: Ctx) => {
  if (value === null || value === undefined) return
  switch (shape.kind) {
    case 'string': {
      if (typeof value !== 'string' || !value) return
      const max = charLimit(ctx.block, path)
      const len = visibleLength(value)
      if (max && len > max) ctx.issues.push({ level: 'warn', block: ctx.block, blockIndex: ctx.index, message: `${human(path)}: ${len} символов при лимите ${max}` })
      if (/(^|\.)(url|href)$/.test(path) && value.startsWith('/') && !value.startsWith('//')) ctx.links.push(value)
      return
    }
    case 'image': {
      if (!isObj(value)) return
      const id = idOf(value.src)
      if (!id) return
      const own = typeof value.alt === 'string' && value.alt.trim()
      const doc = ctx.media.get(String(id))
      if (!own && !doc?.alt && !shapeIsBackground(shape)) {
        ctx.issues.push({ level: 'warn', block: ctx.block, blockIndex: ctx.index, message: `${human(path)}: у картинки нет alt-текста` })
      }
      return
    }
    case 'object':
      if (isObj(value)) for (const p of shape.props) walk(p.shape, value[nameOf(p)], path ? `${path}.${p.key}` : p.key, ctx)
      return
    case 'array': {
      if (!Array.isArray(value)) return
      const rule = BLOCK_LIMITS[ctx.block]?.rows?.[patternOf(path)]
      if (rule) {
        const [min, max] = rule
        if (value.length < min) ctx.issues.push({ level: 'warn', block: ctx.block, blockIndex: ctx.index, message: `${human(path)}: ${value.length} шт., нужно не меньше ${min}` })
        if (value.length > max) ctx.issues.push({ level: 'warn', block: ctx.block, blockIndex: ctx.index, message: `${human(path)}: ${value.length} шт., в макет помещается ${max}` })
      }
      value.forEach((row, i) => walk(shape.of, row, `${path}.${i}`, ctx))
      return
    }
    case 'union':
      if (Array.isArray(value)) {
        value.forEach((row, i) => {
          if (!isObj(row)) return
          const variant = shape.variants.find((v) => v.value === row.blockType)
          if (variant) walk(variant.data, variant.data.kind === 'object' ? row : row.value, `${path}.${i}`, ctx)
        })
      }
      return
    default:
  }
}

const shapeIsBackground = (shape: Shape) => shape.kind === 'image' && shape.background

type PageLike = {
  id: number | string
  title?: Record<string, string> | string | null
  content?: Record<string, Obj[]> | Obj[] | null
  seo?: { title?: Record<string, string> | string | null; description?: Record<string, string> | string | null } | null
}

const byLocale = <T>(v: Record<string, T> | T | null | undefined, locale: string): T | undefined =>
  v && typeof v === 'object' && !Array.isArray(v) && (locale in (v as object) || 'ru' in (v as object)) ? (v as Record<string, T>)[locale] : (v as T | undefined)

/** Адреса, которые существуют на сайте (страницы и разделы из коллекций). */
const knownPaths = async (payload: Payload) => {
  const set = new Set<string>(['/', '/expertise/', '/services/', '/vacancies/', '/internships/', '/about/partners/', '/search/'])
  const add = (p: string) => set.add(`/${p}/`.replace(/\/{2,}/g, '/'))
  const [pages, pubs, jobs, redirects] = await Promise.all([
    payload.find({ collection: 'pages', depth: 0, limit: 5000, pagination: false, overrideAccess: true, select: { path: true } as never }),
    payload.find({ collection: 'publications', depth: 0, limit: 5000, pagination: false, overrideAccess: true, select: { slug: true } as never }),
    payload.find({ collection: 'vacancies', depth: 0, limit: 5000, pagination: false, overrideAccess: true, select: { slug: true, kind: true } as never }),
    payload.find({ collection: 'redirects', depth: 0, limit: 5000, pagination: false, overrideAccess: true, select: { from: true } as never }),
  ])
  for (const d of pages.docs as unknown as { path?: string }[]) if (d.path !== null && d.path !== undefined) add(d.path)
  for (const d of pubs.docs as unknown as { slug?: string }[]) if (d.slug) add(`expertise/${d.slug}`)
  for (const d of jobs.docs as unknown as { slug?: string; kind?: string }[]) if (d.slug) add(`${d.kind === 'internship' ? 'internships' : 'vacancies'}/${d.slug}`)
  for (const d of redirects.docs as unknown as { from?: string }[]) if (d.from) set.add(d.from)
  return set
}

export const checkPage = async (payload: Payload, page: PageLike, locale: 'ru' | 'en'): Promise<Issue[]> => {
  const issues: Issue[] = []
  const rows = (byLocale(page.content as never, locale) ?? []) as Obj[]

  // картинки из медиатеки — чтобы знать их alt
  const mediaIds = new Set<string>()
  const collect = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(collect)
    else if (isObj(v)) {
      const id = 'src' in v ? idOf(v.src) : undefined
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) mediaIds.add(String(id))
      Object.values(v).forEach(collect)
    }
  }
  collect(rows)
  const media = new Map<string, { alt?: string | null }>()
  if (mediaIds.size) {
    const res = await payload.find({ collection: 'media', where: { id: { in: [...mediaIds] } }, depth: 0, limit: mediaIds.size, overrideAccess: true })
    for (const d of res.docs) media.set(String(d.id), d as { alt?: string | null })
  }

  const links: string[] = []
  rows.forEach((row, index) => {
    if (row.hidden || !blockShapes[String(row.blockType)]) return
    const block = String(row.blockType)
    walk(blockShapes[block], row, '', { block, index, issues, media, links })
  })
  if (!rows.length) issues.push({ level: 'error', message: 'На странице нет ни одного блока' })

  // внутренние ссылки
  if (links.length) {
    const known = await knownPaths(payload)
    const prefix = locale === 'en' ? /^\/en(?=\/)/ : /^$/
    for (const link of [...new Set(links)]) {
      const clean = `${link.replace(prefix, '').split(/[?#]/)[0]}/`.replace(/\/{2,}/g, '/')
      if (!known.has(clean)) issues.push({ level: 'warn', message: `Ссылка ${link} ведёт на несуществующую страницу` })
    }
  }

  // SEO
  const seoTitle = byLocale(page.seo?.title as never, locale) as string | undefined
  const seoDescription = byLocale(page.seo?.description as never, locale) as string | undefined
  if (!seoDescription) issues.push({ level: 'warn', message: 'SEO: не заполнено описание (Description) — поисковик возьмёт случайный кусок текста' })
  else if (seoDescription.length > 160) issues.push({ level: 'warn', message: `SEO: описание ${seoDescription.length} символов, поисковик покажет около 160` })
  if (seoTitle && seoTitle.length > 70) issues.push({ level: 'warn', message: `SEO: title ${seoTitle.length} символов, поисковик покажет около 70` })

  // английская версия
  if (locale === 'ru' && page.title && typeof page.title === 'object' && !(page.title as Record<string, string>).en) {
    issues.push({ level: 'warn', message: 'Нет английской версии страницы' })
  }

  for (const i of issues) if (i.block) i.block = BLOCK_META[i.block]?.label ?? i.block
  return issues
}
