/** Общие помощники импорта тестовых данных фронта. */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

import type { FromFrontCtx } from '../blocks/transform'
import { formFromFront } from '../collections/Forms'

export const FIXTURES = path.join(process.cwd(), 'src', 'contract', 'fixtures')
export const FRONT_DIR = path.resolve(process.env.FRONT_DIR ?? '../jet-front-main')

export type Locale = 'ru' | 'en'
export type Json = Record<string, unknown>

export const readJson = async (rel: string): Promise<Json | undefined> => {
  const file = path.join(FIXTURES, rel)
  return existsSync(file) ? (JSON.parse(await readFile(file, 'utf8')) as Json) : undefined
}

export const makeCtx = (payload: Payload, formTitle: string): FromFrontCtx => {
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

