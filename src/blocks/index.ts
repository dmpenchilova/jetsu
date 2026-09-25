import type { Block } from 'payload'

import schemas from '../contract/schemas.json'
import { buildBlock } from './fields'
import { BLOCK_META } from './meta'
import { assignNames, toShape, type Shape } from './shape'

type SchemaFile = { blocks: Record<string, object>; other: Record<string, object> }
const file = schemas as unknown as SchemaFile

/** Структура каждого блока фронта по его типу. */
export const blockShapes: Record<string, Shape> = Object.fromEntries(
  Object.entries(file.blocks).map(([type, schema]) => [type, assignNames(toShape(schema))]),
)

/** Структуры прочих ответов API: хедер и футер, 404, попап формы, SEO, хлебные крошки. */
export const otherShapes: Record<string, Shape> = Object.fromEntries(
  Object.entries(file.other).map(([key, schema]) => [key, assignNames(toShape(schema))]),
)

/** Порядок блоков в библиотеке — как в каталоге ТЗ. */
const order = Object.keys(BLOCK_META)

export const pageBlocks: Block[] = Object.entries(blockShapes)
  .sort(([a], [b]) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999))
  .map(([type, shape]) => buildBlock(type, shape))
