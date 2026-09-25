/**
 * Выгрузка контракта фронта: JSON-схемы блоков и ответов + тестовые данные apiStatic.
 *
 * Запуск из папки фронта (jet-front-main), путь к админке — ADMIN:
 *   ADMIN=../jetsu
 *   node --import $ADMIN/scripts/front-contract/register.mjs --import tsx $ADMIN/scripts/front-contract/dump.mts $ADMIN/src/contract
 */
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

import { zodToJsonSchema } from 'zod-to-json-schema'

const out = process.argv[2]
if (!out) throw new Error('Укажите папку src/contract админки')
const front = process.cwd()
const load = async (p: string) => import(pathToFileURL(join(front, p)).href)

const { blockMap } = await load('src/shared/config/block-map.ts')
const { commonDataSchema } = await load('src/shared/model/common.ts')
const { seoSchema } = await load('src/shared/model/seo.ts')
const { breadcrumbsSchema } = await load('src/shared/ui/breadcrumbs/index.ts')
const { page404Schema } = await load('src/widgets/404/index.tsx')
const { popupCallbackSchema } = await load('src/widgets/popups/callback/index.ts')
const { expertiseDataSchema } = await load('src/shared/model/expertise.ts')
const { catalogDataSchema } = await load('src/shared/model/catalog.ts')
const { detailDataSchema } = await load('src/shared/model/detail.ts')
const { jobsDataSchema, jobsCommonDataSchema } = await load('src/shared/model/jobs.ts')
const { jobDetailDataSchema } = await load('src/shared/model/job-detail.ts')
const { companionsDataSchema } = await load('src/shared/model/companions.ts')

const conv = (s: unknown) => zodToJsonSchema(s as never, { $refStrategy: 'none', target: 'jsonSchema7' })
const schemas: { blocks: Record<string, unknown>; other: Record<string, unknown> } = { blocks: {}, other: {} }
for (const [k, v] of Object.entries(blockMap) as [string, { schema: unknown }][]) schemas.blocks[k] = conv(v.schema)
schemas.other = {
  common: conv(commonDataSchema),
  seo: conv(seoSchema),
  breadcrumbs: conv(breadcrumbsSchema),
  page404: conv(page404Schema),
  popupCallback: conv(popupCallbackSchema),
  expertisePage: conv(expertiseDataSchema),
  catalogPage: conv(catalogDataSchema),
  detailPage: conv(detailDataSchema),
  jobsPage: conv(jobsDataSchema),
  jobsCommon: conv(jobsCommonDataSchema),
  jobDetailPage: conv(jobDetailDataSchema),
  companionsPage: conv(companionsDataSchema),
}
writeFileSync(join(out, 'schemas.json'), JSON.stringify(schemas, null, 1))

const root = join(front, 'apiStatic')
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
for (const f of walk(root)) {
  const rel = relative(root, f).replace(/\.ts$/, '')
  const mod = await import(pathToFileURL(f).href)
  let data = mod.default
  if (typeof data === 'function') data = { __function: true, sample: await data({}) }
  const target = join(out, 'fixtures', `${rel}.json`)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, JSON.stringify(data, null, 1))
}
console.log(`Блоков: ${Object.keys(schemas.blocks).length}. Контракт записан в ${out}`)
