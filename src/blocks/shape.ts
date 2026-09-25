/**
 * Упрощённое описание структуры данных блока, построенное из JSON Schema фронта.
 * По нему строятся и поля админки (fields.ts), и преобразования данных туда и обратно (transform.ts),
 * поэтому админка и API не могут разойтись со схемами фронта.
 */

type JsonSchema = {
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  anyOf?: JsonSchema[]
  enum?: (string | number)[]
  const?: string | number
}

export type Shape =
  | { kind: 'string'; options?: string[] }
  | { kind: 'boolean' }
  | { kind: 'number' }
  | { kind: 'image'; background: boolean }
  | { kind: 'form' }
  | { kind: 'record' }
  | { kind: 'object'; props: Prop[] }
  | { kind: 'array'; of: Shape }
  | { kind: 'union'; variants: { value: string; data: Shape }[] }
  | { kind: 'skip' }

/** key — имя поля во фронте, name — имя поля в админке (отличается, только если иначе ломается база). */
export type Prop = { key: string; name?: string; shape: Shape; required: boolean }

export const nameOf = (p: Prop) => p.name ?? p.key

/** Ключи, которые админка не хранит: фронт вычисляет их сам. */
const SKIP_KEYS = new Set(['titleVariant'])

const keysOf = (s: JsonSchema) => Object.keys(s.properties ?? {})

const isImage = (s: JsonSchema) => {
  const keys = keysOf(s)
  return keys.includes('src') && keys.every((k) => ['src', 'desktop', 'tablet', 'alt', 'type'].includes(k))
}

const isForm = (s: JsonSchema) => {
  const keys = keysOf(s)
  return keys.includes('visible') && keys.includes('hidden')
}

/** Массив вида [{type: 'a'|'b', data: A|B}] — в админке это набор подблоков. */
const unionVariants = (s: JsonSchema): { value: string; data: JsonSchema }[] | null => {
  const p = s.properties
  if (!p || keysOf(s).length !== 2 || !p.type || !p.data) return null
  const values = (p.type.enum ?? (p.type.const !== undefined ? [p.type.const] : [])) as string[]
  const datas = p.data.anyOf ?? [p.data]
  if (values.length < 2 || values.length !== datas.length) return null
  return values.map((value, i) => ({ value, data: datas[i] }))
}

export const toShape = (s: JsonSchema): Shape => {
  if (s.anyOf) {
    // объединения встречаются только внутри форм и подблоков, которые разбираются отдельно
    return { kind: 'skip' }
  }
  const type = Array.isArray(s.type) ? s.type[0] : s.type
  switch (type) {
    case 'string':
      return s.enum ? { kind: 'string', options: s.enum.map(String) } : { kind: 'string' }
    case 'boolean':
      return { kind: 'boolean' }
    case 'number':
    case 'integer':
      return { kind: 'number' }
    case 'array': {
      const item = s.items ?? {}
      const variants = item.type === 'object' ? unionVariants(item) : null
      if (variants) {
        return { kind: 'union', variants: variants.map((v) => ({ value: v.value, data: toShape(v.data) })) }
      }
      const of = toShape(item)
      return of.kind === 'skip' ? of : { kind: 'array', of }
    }
    case 'object': {
      if (isImage(s)) return { kind: 'image', background: keysOf(s).includes('type') }
      if (isForm(s)) return { kind: 'form' }
      // объект с произвольными ключами (параметры ссылки на фильтр)
      if (keysOf(s).length === 0) return { kind: 'record' }
      const required = new Set(s.required ?? [])
      const props: Prop[] = []
      for (const [key, child] of Object.entries(s.properties ?? {})) {
        if (SKIP_KEYS.has(key)) continue
        const shape = toShape(child)
        if (shape.kind === 'skip') continue
        props.push({ key, shape, required: required.has(key) })
      }
      if (props.length === 0) return { kind: 'skip' }
      return { kind: 'object', props }
    }
    default:
      return { kind: 'skip' }
  }
}

/**
 * Массив внутри массива с тем же именем (menu.items.items) ломает связи таблиц в PostgreSQL,
 * поэтому вложенному даём другое имя в админке: items → subitems.
 */
export const assignNames = (shape: Shape, arrayNames: string[] = []): Shape => {
  if (shape.kind === 'object') {
    for (const p of shape.props) {
      if (p.shape.kind === 'array') {
        let name = p.key
        while (arrayNames.includes(name)) name = `sub${name}`
        if (name !== p.key) p.name = name
        assignNames(p.shape.of, [...arrayNames, name])
      } else {
        assignNames(p.shape, arrayNames)
      }
    }
  } else if (shape.kind === 'array') {
    assignNames(shape.of, arrayNames)
  } else if (shape.kind === 'union') {
    for (const v of shape.variants) assignNames(v.data, arrayNames)
  }
  return shape
}
