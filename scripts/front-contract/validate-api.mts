/**
 * Проверка API админки схемами фронта (zod): каждый ответ должен проходить ту же валидацию, что во фронте.
 *
 * Запуск из папки фронта при запущенной админке:
 *   ADMIN=../jetsu
 *   API_BASE=http://localhost:3001/api node --import $ADMIN/scripts/front-contract/register.mjs --import tsx $ADMIN/scripts/front-contract/validate-api.mts
 */
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
const front = process.cwd()
const load = async (p: string) => import(pathToFileURL(join(front, p)).href)
const { expertisePageSchema } = await load('src/shared/model/expertise.ts')
const { catalogPageSchema } = await load('src/shared/model/catalog.ts')
const { detailPageSchema } = await load('src/shared/model/detail.ts')
const { jobsPageSchema, jobsCommonSchema } = await load('src/shared/model/jobs.ts')
const { jobDetailPageSchema } = await load('src/shared/model/job-detail.ts')
const { companionsPageSchema } = await load('src/shared/model/companions.ts')
const { builderPageSchema } = await load('src/shared/model/builder.ts')
const { commonSchema } = await load('src/shared/model/common.ts')
const { expertiseElectorResponseSchema } = await load('src/widgets/expertise-elector/model/index.ts')
const { catalogElectorResponseSchema } = await load('src/widgets/catalog/model/index.ts')
const { jobsResponseSchema } = await load('src/widgets/jobs/model/index.ts')
const { companionsResponseSchema } = await load('src/widgets/companions/model/index.ts')
const API = process.env.API_BASE ?? 'http://localhost:3001/api'
const checks: [string, any, string, any?][] = [
  ['GET', expertisePageSchema, '/expertise'], ['GET', detailPageSchema, '/expertise/news-1'], ['GET', catalogPageSchema, '/services'],
  ['GET', jobsPageSchema, '/vacancies'], ['GET', jobsPageSchema, '/internships'], ['GET', jobDetailPageSchema, '/vacancies/vacancy-1'],
  ['GET', jobDetailPageSchema, '/internships/internship-1'], ['GET', jobsCommonSchema, '/jobs'], ['GET', companionsPageSchema, '/about/partners'],
  ['GET', builderPageSchema, '/pages/'], ['GET', commonSchema, '/common'],
  ['POST', expertiseElectorResponseSchema, '/expertise', { page: 2, sort: 'recommend', search: { text: '', types: { allPublications: ['news'] } } }],
  ['POST', catalogElectorResponseSchema, '/services', { page: 1, text: { text: 'консалтинг' } }],
  ['POST', jobsResponseSchema, '/vacancies', { page: 1, search: { types: { city: ['moskva'] } } }],
  ['POST', companionsResponseSchema, '/about/partners', { page: 1, search: { text: 'агат' } }],
]
let bad = 0
for (const lang of ['ru', 'en']) for (const [m, schema, ep, body] of checks) {
  const res = m === 'GET' ? await fetch(`${API}${ep}?lang=${lang}`) : await fetch(`${API}${ep}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, lang }) })
  const data = await res.json()
  const r = schema.safeParse(data)
  const info = data?.data?.expertiseElector?.items?.length ?? data?.data?.jobs?.items?.length ?? data?.data?.catalog?.items?.length ?? data?.data?.companions?.items?.length ?? data?.items?.length ?? ''
  if (!r.success) { bad++; console.log('FAIL', lang, m, ep, res.status, JSON.stringify(r.error.issues.slice(0, 4))) } else console.log('ok  ', lang, m, ep, res.status, info)
}
console.log('bad', bad)
