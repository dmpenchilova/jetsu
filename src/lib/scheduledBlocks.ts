/**
 * Блоки «показывать с — по»: каждые 15 минут сбрасываем кэш страниц, где такой блок
 * только что появился или пропал, — чтобы сайт не ждал часового обновления.
 */
import type { Payload, TaskConfig } from 'payload'

import { builderTag, revalidateFront } from './revalidate'

export const revalidateScheduledBlocks = async (payload: Payload) => {
  const pool = (payload.db as unknown as { pool: { query: (sql: string, v?: unknown[]) => Promise<{ rows: { path: string | null }[] }> } }).pool
  const res = await pool.query(`
    select distinct p.path from pages p join pages_locales l on l._parent_id = p.id,
      jsonb_array_elements(coalesce(l.content, '[]'::jsonb)) b
    where p._status = 'published' and (
      (b->>'showFrom') is not null and (b->>'showFrom')::timestamptz between now() - interval '16 minutes' and now()
      or (b->>'showUntil') is not null and (b->>'showUntil')::timestamptz between now() - interval '16 minutes' and now()
    )`)
  const paths = res.rows.map((r) => r.path).filter((p): p is string => p !== null)
  if (paths.length) await revalidateFront(payload, paths.map((p) => builderTag(p)))
  return paths.length
}

export const scheduledBlocksTask: TaskConfig = {
  slug: 'revalidate-scheduled-blocks',
  label: 'Показ блоков по расписанию',
  schedule: [{ cron: '*/15 * * * *', queue: 'forms' }],
  handler: (async ({ req }: { req: { payload: Payload } }) => ({ output: { pages: await revalidateScheduledBlocks(req.payload) } })) as unknown as TaskConfig['handler'],
}
