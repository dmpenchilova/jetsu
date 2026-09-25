/**
 * API для фронта jet-front-main. Во фронте переменная API указывает сюда:
 * API=https://<адрес админки>/site-api
 *
 * Страницы конструктора, хедер/футер, 404 и попап отдаются из админки.
 * Разделы, которые появятся на следующих этапах (публикации, каталог, вакансии, партнёры),
 * пока отдают тестовые данные фронта (src/contract/fixtures), чтобы сайт работал целиком.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { footerShape, headerShape, page404Shape, popupCallbackShape } from '@/globals'
import { readFixture } from '@/lib/fixtures'
import { type Locale, type PageDoc, pageToFront, shapeToFront } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const notFound = () => json({ status: 'error', errors: ['not found'] }, 404)

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
    return json(await pageToFront(payload, page as unknown as PageDoc, locale))
  }

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

  const fixture = await readFixture(path, locale)
  return fixture === undefined ? notFound() : json(fixture)
}

export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const url = new URL(req.url)
  const path = cleanPath((await params).path)
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const locale: Locale = body.lang === 'en' || url.searchParams.get('lang') === 'en' ? 'en' : 'ru'

  if (path === 'preview') {
    const hash = typeof body.hash === 'string' ? body.hash : ''
    if (!/^[a-f0-9]{32,64}$/.test(hash)) return notFound()
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'previews',
      where: { and: [{ hash: { equals: hash } }, { expiresAt: { greater_than: new Date().toISOString() } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    return docs[0] ? json(docs[0].data) : notFound()
  }

  // фильтры списков и отправка форм появятся на этапах 3 и 4
  const fixture = (await readFixture(`${path}-post`, locale)) ?? (await readFixture(path, locale))
  if (fixture && typeof fixture === 'object' && '__function' in fixture) return json((fixture as unknown as { sample: unknown }).sample)
  return fixture === undefined ? notFound() : json(fixture)
}
