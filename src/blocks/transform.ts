/**
 * Преобразование данных блоков: из формата админки в формат API фронта (toFront)
 * и обратно (fromFront — используется при импорте тестовых данных фронта).
 */
import { EMPTY_OPTION } from './fields'
import { nameOf, type Shape } from './shape'

export type MediaDoc = { id: number | string; url?: string | null; alt?: string | null }

export type ToFrontCtx = {
  /** Файлы медиатеки по id. */
  media: Map<string, MediaDoc>
  /** Превращает путь файла в адрес, по которому его возьмёт фронт. */
  fileUrl: (doc: MediaDoc) => string | undefined
  /** Id формы → данные формы в формате фронта. */
  forms: Map<string, unknown>
}

export type FromFrontCtx = {
  /** Находит или загружает файл по адресу из данных фронта, возвращает id в медиатеке. */
  media: (url: string, alt?: string) => Promise<number | string | undefined>
  /** Данные формы фронта → id шаблона формы. */
  form: (data: unknown) => Promise<number | string | undefined>
}

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

const idOf = (v: unknown): string | undefined => {
  if (v === null || v === undefined || v === '') return undefined
  if (isObj(v)) return v.id !== undefined ? String(v.id) : undefined
  return String(v)
}

const mediaUrl = (ctx: ToFrontCtx, v: unknown) => {
  const id = idOf(v)
  if (!id) return undefined
  const doc = ctx.media.get(id) ?? (isObj(v) ? (v as MediaDoc) : undefined)
  return doc ? ctx.fileUrl(doc) : undefined
}

export const toFront = (shape: Shape, value: unknown, ctx: ToFrontCtx): unknown => {
  if (value === null || value === undefined) return undefined
  switch (shape.kind) {
    case 'string': {
      if (typeof value !== 'string') return undefined
      if (shape.options && value === EMPTY_OPTION) return ''
      return value.trim() === '' ? undefined : value
    }
    case 'boolean':
      return typeof value === 'boolean' ? value : undefined
    case 'number':
      return typeof value === 'number' ? value : undefined
    case 'image': {
      if (!isObj(value)) return undefined
      const src = mediaUrl(ctx, value.src)
      if (!src) return undefined
      const doc = ctx.media.get(idOf(value.src) ?? '')
      const out: Obj = { src }
      const tablet = mediaUrl(ctx, value.tablet)
      const desktop = mediaUrl(ctx, value.desktop)
      if (tablet) out.tablet = tablet
      if (desktop) out.desktop = desktop
      const alt = (typeof value.alt === 'string' && value.alt.trim()) || doc?.alt || undefined
      if (alt) out.alt = alt
      if (shape.background && typeof value.type === 'string' && value.type) out.type = value.type
      return out
    }
    case 'form': {
      const id = idOf(value)
      return id ? ctx.forms.get(id) : undefined
    }
    case 'record': {
      if (!Array.isArray(value)) return undefined
      const out: Obj = {}
      for (const row of value) if (isObj(row) && typeof row.key === 'string' && row.key) out[row.key] = row.value ?? ''
      return Object.keys(out).length ? out : undefined
    }
    case 'object': {
      if (!isObj(value)) return undefined
      const out: Obj = {}
      for (const p of shape.props) {
        const v = toFront(p.shape, value[nameOf(p)], ctx)
        if (v !== undefined) out[p.key] = v
      }
      return Object.keys(out).length ? out : undefined
    }
    case 'array': {
      if (!Array.isArray(value)) return undefined
      const rows = value
        .filter((row) => !(isObj(row) && row.hidden === true))
        .map((row) => rowToFront(shape.of, row, ctx))
        .filter((v) => v !== undefined)
      return rows
    }
    case 'union': {
      if (!Array.isArray(value)) return undefined
      return value
        .map((row) => {
          if (!isObj(row)) return undefined
          const variant = shape.variants.find((v) => v.value === row.blockType)
          if (!variant) return undefined
          const data = variant.data.kind === 'object' ? toFront(variant.data, row, ctx) : toFront(variant.data, row.value, ctx)
          return data === undefined ? undefined : { type: variant.value, data }
        })
        .filter((v) => v !== undefined)
    }
    default:
      return undefined
  }
}

const rowToFront = (of: Shape, row: unknown, ctx: ToFrontCtx): unknown => {
  if (of.kind === 'object' || of.kind === 'image') return toFront(of, row, ctx)
  if (of.kind === 'array') return isObj(row) ? toFront(of, row.items, ctx) : undefined
  return isObj(row) ? toFront(of, row.value, ctx) : undefined
}

export const fromFront = async (shape: Shape, value: unknown, ctx: FromFrontCtx): Promise<unknown> => {
  if (value === null || value === undefined) return undefined
  switch (shape.kind) {
    case 'string':
      if (typeof value !== 'string') return undefined
      if (shape.options) return value === '' ? EMPTY_OPTION : value
      return value
    case 'boolean':
    case 'number':
      return value
    case 'image': {
      if (!isObj(value) || typeof value.src !== 'string') return undefined
      const alt = typeof value.alt === 'string' ? value.alt : undefined
      const out: Obj = { src: await ctx.media(value.src, alt) }
      if (typeof value.tablet === 'string') out.tablet = await ctx.media(value.tablet, alt)
      if (typeof value.desktop === 'string') out.desktop = await ctx.media(value.desktop, alt)
      if (alt) out.alt = alt
      if (shape.background && typeof value.type === 'string') out.type = value.type
      return out
    }
    case 'form':
      return ctx.form(value)
    case 'record':
      return isObj(value) ? Object.entries(value).map(([key, v]) => ({ key, value: String(v) })) : undefined
    case 'object': {
      if (!isObj(value)) return undefined
      const out: Obj = {}
      for (const p of shape.props) {
        const v = await fromFront(p.shape, value[p.key], ctx)
        if (v !== undefined) out[nameOf(p)] = v
      }
      return out
    }
    case 'array': {
      if (!Array.isArray(value)) return undefined
      const rows: unknown[] = []
      for (const item of value) {
        if (shape.of.kind === 'object' || shape.of.kind === 'image') rows.push(await fromFront(shape.of, item, ctx))
        else if (shape.of.kind === 'array') rows.push({ items: await fromFront(shape.of, item, ctx) })
        else rows.push({ value: await fromFront(shape.of, item, ctx) })
      }
      return rows
    }
    case 'union': {
      if (!Array.isArray(value)) return undefined
      const rows: unknown[] = []
      for (const item of value) {
        if (!isObj(item)) continue
        const variant = shape.variants.find((v) => v.value === item.type)
        if (!variant) continue
        const data = await fromFront(variant.data, item.data, ctx)
        rows.push(variant.data.kind === 'object' ? { blockType: variant.value, ...(data as Obj) } : { blockType: variant.value, value: data })
      }
      return rows
    }
    default:
      return undefined
  }
}

/** Собирает id всех файлов медиатеки, на которые ссылаются данные, чтобы загрузить их одним запросом. */
export const collectMediaIds = (shape: Shape, value: unknown, acc: Set<string>) => {
  if (value === null || value === undefined) return
  switch (shape.kind) {
    case 'image':
      if (isObj(value)) for (const k of ['src', 'tablet', 'desktop']) { const id = idOf(value[k]); if (id) acc.add(id) }
      return
    case 'object':
      if (isObj(value)) for (const p of shape.props) collectMediaIds(p.shape, value[nameOf(p)], acc)
      return
    case 'array':
      if (Array.isArray(value)) {
        for (const row of value) {
          if (shape.of.kind === 'object' || shape.of.kind === 'image') collectMediaIds(shape.of, row, acc)
          else if (shape.of.kind === 'array' && isObj(row)) collectMediaIds(shape.of, row.items, acc)
        }
      }
      return
    case 'union':
      if (Array.isArray(value)) {
        for (const row of value) {
          if (!isObj(row)) continue
          const variant = shape.variants.find((v) => v.value === row.blockType)
          if (variant) collectMediaIds(variant.data, variant.data.kind === 'object' ? row : row.value, acc)
        }
      }
      return
    default:
  }
}

/** Собирает id форм. */
export const collectFormIds = (shape: Shape, value: unknown, acc: Set<string>) => {
  if (value === null || value === undefined) return
  if (shape.kind === 'form') { const id = idOf(value); if (id) acc.add(id); return }
  if (shape.kind === 'object' && isObj(value)) for (const p of shape.props) collectFormIds(p.shape, value[nameOf(p)], acc)
  if (shape.kind === 'array' && Array.isArray(value) && shape.of.kind === 'object') for (const row of value) collectFormIds(shape.of, row, acc)
}
