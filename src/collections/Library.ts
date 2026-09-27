/**
 * Шаблоны страниц и общие блоки.
 *
 * Шаблон — готовый набор блоков: новая «Отрасль», «Направление», «Услуга» создаётся из него одной кнопкой.
 * Общий блок — фрагмент (например, «Связаться с нами» или баннер мероприятия), который вставляется
 * на много страниц блоком «Общий блок»; правка в одном месте меняет все страницы.
 */
import type { Block, CollectionConfig, Payload } from 'payload'

import { hasRole, isLoggedIn } from '../access'
import { pageBlocks } from '../blocks'
import { builderTag, revalidateFront } from '../lib/revalidate'

/** Блок конструктора «Общий блок»: ссылка на фрагмент из раздела «Общие блоки». */
export const SharedBlockRef: Block = {
  slug: 'sharedBlock',
  labels: { singular: 'Общий блок', plural: 'Общие блоки' },
  imageURL: '/blocks/sharedBlock.svg',
  imageAltText: 'Общий блок',
  admin: { group: 'Общие блоки' },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'hidden', label: 'Скрыть блок', type: 'checkbox', admin: { width: '20%' } },
        {
          name: 'ref',
          label: 'Какой общий блок',
          type: 'relationship',
          relationTo: 'shared-blocks',
          required: true,
          admin: { width: '80%', description: 'Содержимое правится в разделе «Общие блоки» и меняется сразу на всех страницах' },
        },
      ],
    },
  ],
}

/** Убирает id блоков, чтобы при копировании они получили новые. */
export const withoutIds = (rows: unknown): unknown => {
  if (Array.isArray(rows)) return rows.map(withoutIds)
  if (rows && typeof rows === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(rows as Record<string, unknown>)) if (k !== 'id') out[k] = withoutIds(v)
    return out
  }
  return rows
}

type Row = { id?: string; blockType: string; hidden?: boolean; ref?: unknown } & Record<string, unknown>

/** Подставляет вместо «Общих блоков» их содержимое (на нужном языке). */
export const expandShared = async (payload: Payload, rows: Row[], locale: 'ru' | 'en', depth = 0): Promise<Row[]> => {
  if (!rows.some((r) => r.blockType === 'sharedBlock')) return rows
  const out: Row[] = []
  for (const row of rows) {
    if (row.blockType !== 'sharedBlock') {
      out.push(row)
      continue
    }
    if (row.hidden || depth > 2) continue
    const id = row.ref && typeof row.ref === 'object' ? (row.ref as { id: number }).id : row.ref
    if (!id) continue
    const shared = (await payload
      .findByID({ collection: 'shared-blocks', id: id as number, locale, depth: 0, overrideAccess: true })
      .catch(() => null)) as { content?: Row[] } | null
    const inner = await expandShared(payload, shared?.content ?? [], locale, depth + 1)
    // uuid блока на сайте — уникальный для этого места страницы
    for (const r of inner) out.push({ ...r, id: `${row.id ?? id}-${r.id ?? ''}` })
  }
  return out
}

const contentField = (blocks: Block[]) => ({
  name: 'content',
  label: 'Блоки',
  type: 'blocks' as const,
  localized: true,
  blocks,
  labels: { singular: 'блок', plural: 'Блоки' },
  admin: { initCollapsed: true },
})

export const PageTemplates: CollectionConfig = {
  slug: 'page-templates',
  labels: { singular: 'Шаблон страницы', plural: 'Шаблоны страниц' },
  admin: {
    useAsTitle: 'title',
    group: 'Конструктор',
    defaultColumns: ['title', 'description', 'updatedAt'],
    description: 'Готовые наборы блоков. Новую страницу из шаблона создают кнопкой в списке страниц; шаблон из готовой страницы — кнопкой «Сохранить как шаблон» в самой странице',
  },
  access: { read: isLoggedIn, create: hasRole('admin', 'editor'), update: hasRole('admin', 'editor'), delete: hasRole('admin', 'editor') },
  fields: [
    { name: 'title', label: 'Название шаблона', type: 'text', required: true },
    { name: 'description', label: 'Для чего', type: 'text' },
    contentField([...pageBlocks, SharedBlockRef]),
  ],
  endpoints: [
    {
      // шаблон из страницы: POST /cms-api/page-templates/from-page { page, title }
      path: '/from-page',
      method: 'post',
      handler: async (req) => {
        const role = (req.user as { role?: string } | null)?.role
        if (role !== 'admin' && role !== 'editor') return Response.json({ error: 'Нет прав' }, { status: 403 })
        const body = (await req.json?.().catch(() => ({}))) as { page?: number; title?: string }
        if (!body.page) return Response.json({ error: 'Не указана страница' }, { status: 400 })
        const page = (await req.payload.findByID({ collection: 'pages', id: body.page, locale: 'all' as 'ru', depth: 0, draft: true, overrideAccess: true })) as unknown as {
          title?: Record<string, string>
          content?: Record<string, unknown[]>
        }
        const title = body.title?.trim() || `Шаблон: ${page.title?.ru ?? body.page}`
        const tpl = await req.payload.create({
          collection: 'page-templates',
          locale: 'ru',
          data: { title, content: withoutIds(page.content?.ru ?? []) as never },
          overrideAccess: true,
          req,
        })
        if (page.content?.en?.length) {
          await req.payload.update({ collection: 'page-templates', id: tpl.id, locale: 'en', data: { content: withoutIds(page.content.en) as never }, overrideAccess: true, req })
        }
        return Response.json({ id: tpl.id })
      },
    },
  ],
}

export const SharedBlocks: CollectionConfig = {
  slug: 'shared-blocks',
  labels: { singular: 'Общий блок', plural: 'Общие блоки' },
  admin: {
    useAsTitle: 'title',
    group: 'Конструктор',
    defaultColumns: ['title', 'updatedAt'],
    description: 'Фрагменты, которые стоят на многих страницах. Вставляются блоком «Общий блок»; правка здесь сразу меняет все страницы',
  },
  access: { read: isLoggedIn, create: hasRole('admin', 'editor'), update: hasRole('admin', 'editor'), delete: hasRole('admin', 'editor') },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true },
    contentField(pageBlocks),
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        await revalidateUsing(req.payload, doc.id as number)
        return doc
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const paths = await pagesUsing(req.payload, id as number)
        if (paths.length) {
          const { APIError } = await import('payload')
          throw new APIError(`Общий блок стоит на страницах: ${paths.map((p) => `/${p}`).join(', ')}. Сначала уберите его оттуда`, 400, undefined, true)
        }
      },
    ],
  },
}

/** Страницы, где стоит общий блок. */
export const pagesUsing = async (payload: Payload, id: number) => {
  const pool = (payload.db as unknown as { pool: { query: (sql: string, v: unknown[]) => Promise<{ rows: { path: string | null }[] }> } }).pool
  const res = await pool.query(
    `select distinct p.path from pages p join pages_locales l on l._parent_id = p.id
     where l.content @> $1::jsonb`,
    [JSON.stringify([{ blockType: 'sharedBlock', ref: id }])],
  )
  return res.rows.map((r) => r.path ?? '').filter((p, i, a) => a.indexOf(p) === i)
}

const revalidateUsing = async (payload: Payload, id: number) => {
  const paths = await pagesUsing(payload, id).catch(() => [])
  if (paths.length) await revalidateFront(payload, paths.map((p) => builderTag(p)))
}
