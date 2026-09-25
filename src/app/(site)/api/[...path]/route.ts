/**
 * API для фронта jet-front-main. Фронт обращается к https://<API>/api/…,
 * где API — адрес админки из его .env (без протокола, например admin.jet.su).
 *
 * Страницы конструктора, хедер/футер, 404 и попап отдаются из админки.
 * Разделы, которые появятся на следующих этапах (публикации, каталог, вакансии, партнёры),
 * пока отдают тестовые данные фронта (src/contract/fixtures), чтобы сайт работал целиком.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { footerShape, headerShape, page404Shape, popupCallbackShape } from '@/globals'
import { readFixture } from '@/lib/fixtures'
import { handleFormSubmit } from '@/lib/forms/submit'
import {
  catalogFilter,
  catalogPage,
  expertiseFilter,
  expertisePage,
  jobPage,
  jobsCommon,
  jobsFilter,
  jobsPage,
  partnersFilter,
  partnersPage,
  publicationPage,
} from '@/lib/lists'
import { readPreviewHash } from '@/lib/preview'
import { logQuery, searchSite } from '@/lib/search/query'
import { indexingAllowed, redirectsList, robotsTxt, sitemapUrls } from '@/lib/seo'
import { type Locale, type PageDoc, pageToFront, shapeToFront } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const notFound = () => json({ status: 'error', errors: ['not found'] }, 404)

/** canonical и запрет индексации (если он включён в «SEO и индексация») для ответов страниц. */
const withSeo = async (payload: Awaited<ReturnType<typeof getPayload>>, res: unknown, path: string, locale: Locale) => {
  const data = (res as { data?: { seo?: Record<string, string> } } | null)?.data
  if (!data || typeof data !== 'object') return res
  const seo = (data.seo ??= {})
  seo.canonical = `${locale === 'en' ? '/en' : ''}/${path}${path ? '/' : ''}`.replace(/\/{2,}/g, '/')
  if (!(await indexingAllowed(payload))) seo.robots = 'noindex, nofollow'
  return res
}

const localeOf = (url: URL): Locale => (url.searchParams.get('lang') === 'en' ? 'en' : 'ru')

const cleanPath = (segments: string[]) =>
  segments
    .map((s) => decodeURIComponent(s))
    .filter((s) => s !== '')
    .join('/')

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const url = new URL(req.url)
  const locale = localeOf(url)
  const path = cleanPath((await params).path)
  const payload = await getPayload({ config })

  if (path === 'pages' || path.startsWith('pages/')) {
    const pagePath = path.slice('pages'.length).replace(/^\//, '')
    const { docs } = await payload.find({
      collection: 'pages',
      where: { path: { equals: pagePath } },
      locale,
      depth: 0,
      limit: 1,
      draft: false,
      overrideAccess: true,
    })
    const page = docs[0]
    if (!page || page._status !== 'published') return notFound()
    return json(await withSeo(payload, await pageToFront(payload, page as unknown as PageDoc, locale), pagePath, locale))
  }

  // поиск по сайту: ?q=запрос&type=рубрика&page=2
  if (path === 'search') {
    const q = url.searchParams.get('q') ?? ''
    const rubric = url.searchParams.get('type') || undefined
    const data = await searchSite(payload, { q, rubric, page: Number(url.searchParams.get('page')) || 1, locale })
    if (!url.searchParams.get('page') || url.searchParams.get('page') === '1') logQuery(payload, q, data.total, rubric, locale)
    return json({ status: 'success', data })
  }

  // SEO-файлы сайта
  if (path === 'sitemap') return json({ status: 'success', data: await sitemapUrls(payload) })
  if (path === 'robots') {
    const site = url.searchParams.get('site') || process.env.FRONT_URL || ''
    return new Response(await robotsTxt(payload, site), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
  }
  if (path === 'redirects') return json({ status: 'success', data: await redirectsList(payload) })

  if (path === 'common') {
    const [header, footer] = await Promise.all([
      payload.findGlobal({ slug: 'header', locale, depth: 0, overrideAccess: true }),
      payload.findGlobal({ slug: 'footer', locale, depth: 0, overrideAccess: true }),
    ])
    return json({
      status: 'success',
      data: {
        header: (await shapeToFront(payload, headerShape, header, locale)) ?? { menu: [] },
        footer: (await shapeToFront(payload, footerShape, footer, locale)) ?? { menu: [] },
      },
    })
  }

  if (path === 'not-found') {
    const doc = await payload.findGlobal({ slug: 'not-found', locale, depth: 0, overrideAccess: true })
    // фронт ждёт эти данные без обёртки status/data
    return json((await shapeToFront(payload, page404Shape, doc, locale)) ?? {})
  }

  if (path === 'popup/callback') {
    const doc = await payload.findGlobal({ slug: 'popup-callback', locale, depth: 0, overrideAccess: true })
    const data = await shapeToFront(payload, popupCallbackShape, doc, locale)
    return data ? json(data) : notFound()
  }

  // разделы из коллекций
  const query: Record<string, string[]> = {}
  url.searchParams.forEach((value, key) => {
    if (key !== 'lang') query[key] = [...(query[key] ?? []), value]
  })
  const parts = path.split('/')
  const seo = async (res: unknown) => json(await withSeo(payload, res, path, locale))
  if (path === 'expertise') return seo(await expertisePage(payload, locale, query))
  if (parts[0] === 'expertise' && parts.length === 2) {
    const res = await publicationPage(payload, locale, parts[1])
    return res ? seo(res) : notFound()
  }
  if (path === 'services') return seo(await catalogPage(payload, locale, query))
  if (path === 'vacancies') return seo(await jobsPage(payload, locale, 'vacancy', query))
  if (path === 'internships') return seo(await jobsPage(payload, locale, 'internship', query))
  if ((parts[0] === 'vacancies' || parts[0] === 'internships') && parts.length === 2) {
    const res = await jobPage(payload, locale, parts[0] === 'vacancies' ? 'vacancy' : 'internship', parts[1])
    return res ? seo(res) : notFound()
  }
  if (path === 'jobs') return json(await jobsCommon(payload, locale))
  if (path === 'about/partners') return seo(await partnersPage(payload, locale, query))

  const fixture = await readFixture(path, locale)
  return fixture === undefined ? notFound() : json(fixture)
}

export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const url = new URL(req.url)
  const path = cleanPath((await params).path)

  // заявки из форм сайта (multipart с файлами или JSON)
  if (path === 'form/callback') {
    const payload = await getPayload({ config })
    try {
      return await handleFormSubmit(payload, req)
    } catch (err) {
      payload.logger.error({ err }, 'form submit')
      return json({ status: 'error', data: { success: false, message: 'Ошибка сервера' } }, 500)
    }
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const locale: Locale = body.lang === 'en' || url.searchParams.get('lang') === 'en' ? 'en' : 'ru'

  if (path === 'preview') {
    const target = typeof body.hash === 'string' ? readPreviewHash(body.hash) : null
    if (!target) return notFound()
    const payload = await getPayload({ config })
    const page = await payload
      .findByID({ collection: 'pages', id: target.id, locale: target.locale, draft: true, depth: 0, overrideAccess: true })
      .catch(() => null)
    if (!page) return notFound()
    const res = await pageToFront(payload, page as unknown as PageDoc, target.locale)
    if (target.block) {
      // превью одного блока — в том виде, в каком его ждёт страница /preview фронта
      const block = (res.data.content as { uuid: string }[]).find((b) => b.uuid === target.block)
      return block ? json({ status: 'success', data: block }) : notFound()
    }
    return json(res)
  }

  // фильтры списков
  const filters = ['expertise', 'services', 'vacancies', 'internships', 'about/partners']
  if (filters.includes(path)) {
    const payload = await getPayload({ config })
    if (path === 'expertise') return json(await expertiseFilter(payload, locale, body))
    if (path === 'services') return json(await catalogFilter(payload, locale, body))
    if (path === 'about/partners') return json(await partnersFilter(payload, locale, body))
    return json(await jobsFilter(payload, locale, { ...body, kind: path === 'internships' ? 'internship' : 'vacancy' }))
  }

  const fixture = (await readFixture(`${path}-post`, locale)) ?? (await readFixture(path, locale))
  if (fixture && typeof fixture === 'object' && '__function' in fixture) return json((fixture as unknown as { sample: unknown }).sample)
  return fixture === undefined ? notFound() : json(fixture)
}
