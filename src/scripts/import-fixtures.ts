/**
 * Импорт тестовых данных фронта (apiStatic) в админку: страницы конструктора RU/EN,
 * хедер и футер, 404, попап формы. Картинки и видео загружаются в медиатеку.
 *
 * Запуск: FRONT_DIR=../jet-front-main npm run import:fixtures
 * Повторный запуск обновляет те же страницы, файлы не дублируются.
 */
import 'dotenv/config'

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { blockShapes } from '../blocks'
import { fromFront, type FromFrontCtx } from '../blocks/transform'
import { formFromFront } from '../collections/Forms'
import { footerShape, headerShape, page404Shape, popupCallbackShape } from '../globals'

const FIXTURES = path.join(process.cwd(), 'src', 'contract', 'fixtures')
const FRONT_DIR = path.resolve(process.env.FRONT_DIR ?? '../jet-front-main')

type Locale = 'ru' | 'en'
type Json = Record<string, unknown>

const readJson = async (rel: string): Promise<Json | undefined> => {
  const file = path.join(FIXTURES, rel)
  return existsSync(file) ? (JSON.parse(await readFile(file, 'utf8')) as Json) : undefined
}

const makeCtx = (payload: Payload, formTitle: string): FromFrontCtx => {
  const mediaCache = new Map<string, number | string | undefined>()
  return {
    media: async (url, alt) => {
      if (mediaCache.has(url)) return mediaCache.get(url)
      const found = await payload.find({ collection: 'media', where: { sourcePath: { equals: url } }, limit: 1, depth: 0 })
      let id = found.docs[0]?.id
      if (!id) {
        const file = path.join(FRONT_DIR, 'public', decodeURIComponent(url.split('?')[0]))
        if (!url.startsWith('/') || !existsSync(file)) {
          payload.logger.warn(`Файл не найден: ${url}`)
          mediaCache.set(url, undefined)
          return undefined
        }
        const doc = await payload.create({ collection: 'media', data: { alt: alt ?? '', sourcePath: url }, filePath: file })
        id = doc.id
      }
      mediaCache.set(url, id)
      return id
    },
    form: async (data) => {
      const form = formFromFront(data as Parameters<typeof formFromFront>[0])
      const key = createHash('sha1').update(JSON.stringify(form)).digest('hex').slice(0, 12)
      const title = `${formTitle} · ${key}`
      const found = await payload.find({ collection: 'forms', where: { title: { equals: title } }, limit: 1, depth: 0 })
      if (found.docs[0]) return found.docs[0].id
      // шаблон из тестовых данных одинаков для обоих языков
      const doc = await payload.create({ collection: 'forms', locale: 'ru', data: { title, kind: 'business', ...form } })
      await payload.update({ collection: 'forms', id: doc.id, locale: 'en', data: { title, ...form } })
      return doc.id
    },
  }
}

const blocksFromFront = async (content: Json[], ctx: FromFrontCtx) => {
  const rows: Json[] = []
  for (const block of content) {
    const type = String(block.type)
    const shape = blockShapes[type]
    if (!shape) continue
    const data = (await fromFront(shape, block.data, ctx)) as Json
    rows.push({ blockType: type, ...data })
  }
  return rows
}

const listPages = async (dir: string, prefix = ''): Promise<string[]> => {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...(await listPages(path.join(dir, entry.name), `${prefix}${entry.name}/`)))
    else if (entry.name.endsWith('.json')) out.push(`${prefix}${entry.name.replace(/\.json$/, '')}`)
  }
  return out
}

const pathOf = (name: string) => (name === 'index' ? '' : name.replace(/\/index$/, ''))

const ensurePage = async (payload: Payload, pagePath: string, title: string): Promise<number> => {
  const found = await payload.find({ collection: 'pages', where: { path: { equals: pagePath } }, limit: 1, depth: 0, draft: true })
  if (found.docs[0]) return Number(found.docs[0].id)
  const parts = pagePath.split('/')
  const slug = parts.pop() ?? ''
  const parent = parts.length ? await ensurePage(payload, parts.join('/'), parts[parts.length - 1]) : null
  const doc = await payload.create({
    collection: 'pages',
    locale: 'ru',
    draft: true,
    data: { title, slug, parent, _status: 'draft' },
  })
  return Number(doc.id)
}

const importPage = async (payload: Payload, name: string, locale: Locale) => {
  const fixture = await readJson(`${locale === 'en' ? 'en/' : ''}pages/${name}.json`)
  const data = fixture?.data as Json | undefined
  if (!data) return
  const seo = (data.seo ?? {}) as Json
  const crumbs = data.breadcrumbs as { items?: { title: string }[]; variant?: string } | undefined
  const crumbTitle = crumbs?.items?.[crumbs.items.length - 1]?.title
  const title = String(seo.title ?? crumbTitle ?? name)
  const pagePath = pathOf(name)
  const id = await ensurePage(payload, pagePath, title)
  const ctx = makeCtx(payload, 'Форма из тестовых данных')
  const content = await blocksFromFront((data.content as Json[]) ?? [], ctx)
  await payload.update({
    collection: 'pages',
    id,
    locale,
    data: {
      title,
      content,
      breadcrumbs: {
        show: !!crumbs,
        variant: crumbs?.variant === 'breadcrumbs_blue' ? 'breadcrumbs_blue' : 'default',
        title: crumbTitle && crumbTitle !== title ? crumbTitle : null,
      },
      seo: {
        title: (seo.title as string) ?? null,
        description: (seo.description as string) ?? null,
        keywords: (seo.keywords as string) ?? null,
      },
      _status: 'published',
    },
  })
  payload.logger.info(`Страница /${pagePath} (${locale}): ${content.length} блоков`)
}

const importGlobal = async (payload: Payload, slug: 'header' | 'footer' | 'not-found' | 'popup-callback', shape: Parameters<typeof fromFront>[0], value: unknown, locale: Locale) => {
  if (!value) return
  const ctx = makeCtx(payload, 'Попап «Связаться с нами»')
  const data = (await fromFront(shape, value, ctx)) as Json
  await payload.updateGlobal({ slug, locale, data })
  payload.logger.info(`Настройки «${slug}» (${locale}) обновлены`)
}

const run = async () => {
  const payload = await getPayload({ config })
  for (const locale of ['ru', 'en'] as Locale[]) {
    const names = await listPages(path.join(FIXTURES, locale === 'en' ? 'en/pages' : 'pages'))
    for (const name of names) await importPage(payload, name, locale)

    const prefix = locale === 'en' ? 'en/' : ''
    const common = (await readJson(`${prefix}common.json`))?.data as Json | undefined
    await importGlobal(payload, 'header', headerShape, common?.header, locale)
    await importGlobal(payload, 'footer', footerShape, common?.footer, locale)
    await importGlobal(payload, 'not-found', page404Shape, await readJson(`${prefix}not-found.json`), locale)
    await importGlobal(payload, 'popup-callback', popupCallbackShape, await readJson(`${prefix}popup/callback.json`), locale)
  }
  payload.logger.info('Импорт завершён')
  process.exit(0)
}

try {
  await run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
