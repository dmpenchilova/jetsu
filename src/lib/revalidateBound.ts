import type { Payload } from 'payload'

import { BINDINGS, sourceOf } from '../blocks/bindings'
import { builderTag, revalidateFront } from './revalidate'

/**
 * Запись коллекции изменилась — сбрасываем кэш страниц, где блоки берут данные из этой коллекции.
 */
export const revalidateBound = async (payload: Payload, collection: string) => {
  const types = Object.entries(BINDINGS)
    .filter(([, b]) => b.collection === collection)
    .map(([type]) => type)
  if (!types.length) return
  const { docs } = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { path: true, content: true },
    overrideAccess: true,
  })
  const tags = docs
    .filter((p) => ((p.content ?? []) as Record<string, unknown>[]).some((row) => types.includes(String(row.blockType)) && sourceOf(row) !== 'manual'))
    .map((p) => builderTag(String(p.path ?? '')))
  if (tags.length) await revalidateFront(payload, tags)
}
