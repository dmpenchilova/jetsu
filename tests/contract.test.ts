/**
 * Контрактный тест: каждая тестовая страница фронта (apiStatic) проходит путь
 * «формат фронта → поля админки → формат фронта» без потерь.
 * Так проверяется, что все 81 блок, хедер, футер, 404 и попап сохраняются и отдаются корректно.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { blockShapes } from '../src/blocks'
import { EMPTY_OPTION } from '../src/blocks/fields'
import type { Shape } from '../src/blocks/shape'
import { fromFront, toFront, type ToFrontCtx } from '../src/blocks/transform'
import { formFromFront, formToFront } from '../src/collections/Forms'
import { footerShape, headerShape, page404Shape, popupCallbackShape } from '../src/globals'

const FIXTURES = path.join(__dirname, '..', 'src', 'contract', 'fixtures')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

/** Убирает то, что фронт и так отбрасывает: пустые строки и списки, uuid, titleVariant. */
const normalize = (x: unknown): unknown => {
  if (Array.isArray(x)) return x.map(normalize)
  if (x && typeof x === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(x)) {
      if (k === 'titleVariant' || k === 'uuid') continue
      if (v === '' || v === null || v === undefined) continue
      if (Array.isArray(v) && v.length === 0) continue
      if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue
      out[k] = normalize(v)
    }
    return out
  }
  return x
}

/** Файлы и формы «хранятся» в памяти: id файла = его адрес, id формы = номер в списке. */
const roundTrip = async (shape: Shape, value: unknown) => {
  const forms: unknown[] = []
  const stored = await fromFront(shape, value, {
    media: async (url) => url,
    form: async (data) => {
      forms.push(data)
      return String(forms.length - 1)
    },
  })
  const ctx: ToFrontCtx = {
    media: new Map(),
    fileUrl: (doc) => String(doc.id),
    forms: new Map(forms.map((f, i) => [String(i), formToFront(formFromFront(f as Parameters<typeof formFromFront>[0]))])),
  }
  // картинки: id → документ медиатеки с тем же адресом
  const collect = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(collect)
    else if (v && typeof v === 'object') Object.values(v).forEach(collect)
    else if (typeof v === 'string' && v.startsWith('/')) ctx.media.set(v, { id: v, url: v })
  }
  collect(stored)
  return toFront(shape, stored, ctx)
}

const pages = walk(FIXTURES).filter((f) => /[/\\]pages[/\\]/.test(f))

describe('страницы конструктора', () => {
  it.each(pages.map((f) => [path.relative(FIXTURES, f), f]))('%s', async (_, file) => {
    const content = JSON.parse(readFileSync(file, 'utf8')).data.content as { type: string; data: unknown }[]
    for (const block of content) {
      const shape = blockShapes[block.type]
      expect(shape, `блок ${block.type} есть в админке`).toBeDefined()
      const back = await roundTrip(shape, block.data)
      expect(normalize(back), `блок ${block.type}`).toEqual(normalize(block.data))
    }
  })
})

describe('настройки сайта', () => {
  for (const lang of ['', 'en/']) {
    it(`хедер и футер ${lang || 'ru'}`, async () => {
      const common = JSON.parse(readFileSync(path.join(FIXTURES, `${lang}common.json`), 'utf8')).data
      expect(normalize(await roundTrip(headerShape, common.header))).toEqual(normalize(common.header))
      expect(normalize(await roundTrip(footerShape, common.footer))).toEqual(normalize(common.footer))
    })
    it(`404 и попап ${lang || 'ru'}`, async () => {
      const nf = JSON.parse(readFileSync(path.join(FIXTURES, `${lang}not-found.json`), 'utf8'))
      const popup = JSON.parse(readFileSync(path.join(FIXTURES, `${lang}popup/callback.json`), 'utf8'))
      expect(normalize(await roundTrip(page404Shape, nf))).toEqual(normalize(nf))
      expect(normalize(await roundTrip(popupCallbackShape, popup))).toEqual(normalize(popup))
    })
  }
})

describe('библиотека блоков', () => {
  it('в админке все 81 блок фронта', () => {
    expect(Object.keys(blockShapes)).toHaveLength(81)
  })
  it('пустое значение select хранится как default', () => {
    expect(EMPTY_OPTION).toBe('default')
  })
})

/** Полностью заполненный пример данных по структуре блока — для блоков, которых нет в тестовых страницах. */
const sample = (shape: Shape, key = 'x', i = 0): unknown => {
  switch (shape.kind) {
    case 'string':
      return shape.options ? shape.options[shape.options.length - 1] : `${key} ${i}`
    case 'boolean':
      return true
    case 'number':
      return 7
    case 'image':
      return { src: `/img/${key}-${i}.jpg`, tablet: `/img/${key}-${i}-t.jpg`, desktop: `/img/${key}-${i}-d.jpg`, alt: `alt ${i}`, ...(shape.background ? { type: 'image' } : {}) }
    case 'form':
      return { visible: [{ type: 'input', data: { name: 'name', placeholder: 'Имя', validations: ['required'] } }], btn: { title: 'Отправить' }, action: '/form/callback' }
    case 'record':
      return { tema: 'cod' }
    case 'object':
      return Object.fromEntries(shape.props.map((p) => [p.key, sample(p.shape, p.key, i)]))
    case 'array':
      return [sample(shape.of, key, 1), sample(shape.of, key, 2)]
    case 'union':
      return shape.variants.map((v, n) => ({ type: v.value, data: sample(v.data, v.value, n) }))
    default:
      return undefined
  }
}

describe('все 81 блок на синтетических данных', () => {
  it.each(Object.keys(blockShapes))('%s', async (type) => {
    const shape = blockShapes[type]
    const data = sample(shape)
    expect(normalize(await roundTrip(shape, data))).toEqual(normalize(data))
  })
})
