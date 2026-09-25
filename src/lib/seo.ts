/**
 * Данные для SEO-файлов сайта: карта сайта, robots.txt, список редиректов.
 * Фронт отдаёт их по адресам /sitemap.xml и /robots.txt и проверяет редиректы в middleware.
 */
import type { Payload, Where } from 'payload'

import { DEFAULT_ROBOTS, type SeoSettingsDoc } from '../globals/seoSettings'

type Url = { loc: string; lastmod?: string; alternates?: { ru?: string; en?: string } }

/** Разделы, которые собирает не конструктор, а списки из коллекций. */
const LIST_PAGES = ['expertise', 'services', 'vacancies', 'internships', 'about/partners']

const settingsOf = async (payload: Payload) =>
  (await payload.findGlobal({ slug: 'seo-settings', depth: 0, overrideAccess: true }).catch(() => ({}))) as SeoSettingsDoc

const pathFor = (path: string, locale: 'ru' | 'en') => `${locale === 'en' ? '/en' : ''}/${path}${path ? '/' : ''}`.replace(/\/{2,}/g, '/')

/** Все опубликованные записи коллекции с датой и наличием английской версии. */
const published = async (payload: Payload, collection: 'pages' | 'publications' | 'vacancies', where: Where = {}) => {
  const out: { doc: Record<string, unknown>; en: boolean }[] = []
  let page = 1
  for (;;) {
    const res = await payload.find({
      collection,
      where: { and: [{ _status: { equals: 'published' } }, where] },
      locale: 'all' as 'ru',
      depth: 0,
      limit: 500,
      page,
      overrideAccess: true,
      select: { title: true, path: true, slug: true, kind: true, updatedAt: true, seo: true } as never,
    })
    for (const doc of res.docs as unknown as Record<string, unknown>[]) {
      const title = doc.title as Record<string, string> | undefined
      out.push({ doc, en: !!title?.en })
    }
    if (!res.hasNextPage) break
    page += 1
  }
  return out
}

const excluded = (patterns: string[], path: string) =>
  patterns.some((p) => {
    const norm = p.trim()
    if (!norm) return false
    if (norm.endsWith('*')) return path.startsWith(norm.slice(0, -1))
    return path === norm || path === `${norm}/` || `${path}/` === norm
  })

export const sitemapUrls = async (payload: Payload) => {
  const settings = await settingsOf(payload)
  if (settings.indexing === false) return []
  const exclude = settings.exclude ?? []
  const urls: Url[] = []
  const add = (path: string, lastmod: unknown, en: boolean, ruExists = true) => {
    const ru = pathFor(path, 'ru')
    const enPath = pathFor(path, 'en')
    const alternates = en && ruExists ? { ru, en: enPath } : undefined
    const date = typeof lastmod === 'string' ? lastmod : undefined
    if (ruExists && !excluded(exclude, ru)) urls.push({ loc: ru, lastmod: date, alternates })
    if (en && !excluded(exclude, enPath)) urls.push({ loc: enPath, lastmod: date, alternates })
  }

  for (const { doc, en } of await published(payload, 'pages')) {
    const robots = doc.seo as { robots?: string | null } | undefined
    if (robots?.robots && /noindex/.test(robots.robots)) continue
    add(String(doc.path ?? ''), doc.updatedAt, en)
  }
  const lastPub = await payload
    .find({ collection: 'publications', where: { _status: { equals: 'published' } }, sort: '-updatedAt', limit: 1, depth: 0, overrideAccess: true })
    .catch(() => null)
  for (const p of LIST_PAGES) add(p, lastPub?.docs[0]?.updatedAt, true)
  for (const { doc, en } of await published(payload, 'publications')) add(`expertise/${doc.slug}`, doc.updatedAt, en)
  for (const { doc, en } of await published(payload, 'vacancies')) {
    add(`${doc.kind === 'internship' ? 'internships' : 'vacancies'}/${doc.slug}`, doc.updatedAt, en)
  }
  // без повторов (страница конструктора может совпасть с разделом-списком)
  const seen = new Set<string>()
  return urls.filter((u) => (seen.has(u.loc) ? false : (seen.add(u.loc), true)))
}

export const robotsTxt = async (payload: Payload, siteUrl: string) => {
  const settings = await settingsOf(payload)
  const base = siteUrl.replace(/\/$/, '')
  if (settings.indexing === false) return 'User-agent: *\nDisallow: /\n'
  const body = (settings.robots ?? DEFAULT_ROBOTS).trim()
  return `${body}\n\nSitemap: ${base}/sitemap.xml\n`
}

export const redirectsList = async (payload: Payload) => {
  const res = await payload.find({
    collection: 'redirects',
    where: { active: { equals: true } },
    limit: 5000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  return res.docs.map((r) => ({ from: r.from as string, to: r.to as string, code: Number(r.code ?? 301) }))
}

export const indexingAllowed = async (payload: Payload) => (await settingsOf(payload)).indexing !== false
