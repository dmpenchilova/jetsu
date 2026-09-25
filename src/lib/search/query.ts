/**
 * Поиск по индексу средствами PostgreSQL: морфология (русский/английский словарь),
 * поиск по началу слова, ранжирование (совпадение в заголовке важнее), сниппет с подсветкой.
 */
import type { Payload } from 'payload'

import { SEARCH_TYPES } from '../../collections/Search'

type Locale = 'ru' | 'en'

export const PAGE_SIZE = 10
const SNIPPET = 210

/** Рубрикатор: как в документе «Требования к поиску» — несколько типов в одной рубрике. */
export const RUBRICS: { id: string; ru: string; en: string; types: string[] }[] = [
  { id: 'news', ru: 'Новости', en: 'News', types: ['news'] },
  { id: 'article', ru: 'Статьи', en: 'Articles', types: ['article', 'journal'] },
  { id: 'service', ru: 'Услуги', en: 'Services', types: ['service'] },
  { id: 'company', ru: 'О компании', en: 'About', types: ['company', 'project', 'other'] },
  { id: 'industry', ru: 'Отрасли', en: 'Industries', types: ['industry'] },
  { id: 'career', ru: 'Карьера', en: 'Career', types: ['career'] },
]

const TYPE_LABEL = Object.fromEntries(SEARCH_TYPES.map((t) => [t.value, t.label]))
const TYPE_LABEL_EN: Record<string, string> = {
  news: 'News', article: 'Article', journal: 'Journal', service: 'Service', company: 'About', industry: 'Industry', project: 'Project', career: 'Career', other: 'Page',
}
const TYPE_LABEL_RU: Record<string, string> = {
  news: 'Новость', article: 'Статья', journal: 'Журнал', service: 'Услуга', company: 'О компании', industry: 'Отрасль', project: 'Проект', career: 'Карьера', other: 'Страница',
}
void TYPE_LABEL

/** Запрос посетителя → tsquery: каждое слово с поиском по началу, все слова обязательны. */
export const toTsQuery = (q: string) =>
  q
    .toLowerCase()
    .replace(/ё/g, 'е')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 0)
    .slice(0, 8)
    .map((w) => `${w.replace(/'/g, '')}:*`)
    .join(' & ')

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Обрезает сниппет до ~210 знаков по границе слова, сохраняя подсветку <mark>. */
const cutSnippet = (html: string) => {
  const plain = html.replace(/<\/?mark>/g, '')
  if (plain.length <= SNIPPET) return html
  let visible = 0
  let out = ''
  for (const part of html.split(/(<\/?mark>)/)) {
    if (part === '<mark>' || part === '</mark>') {
      out += part
      continue
    }
    if (visible + part.length > SNIPPET) {
      const cut = part.slice(0, SNIPPET - visible)
      out += cut.replace(/\s+\S*$/, '') + '…'
      if (out.split('<mark>').length > out.split('</mark>').length) out += '</mark>'
      return out
    }
    out += part
    visible += part.length
  }
  return out
}

type Row = { id: number; type: string; title: string; url: string; tags: unknown; snippet: string; title_hl: string; date: string | null; head: string }

export const searchSite = async (payload: Payload, params: { q: string; rubric?: string; page?: number; locale: Locale }) => {
  const q = params.q.trim().slice(0, 200)
  const cfg = params.locale === 'en' ? 'english' : 'russian'
  const page = Math.max(1, Math.min(100, params.page ?? 1))
  const empty = { query: q, total: 0, page: 1, pages: 0, rubrics: RUBRICS.map((r) => ({ id: r.id, name: r[params.locale], count: 0 })), items: [] as unknown[] }
  const tsq = toTsQuery(q)
  if (!tsq) return empty

  const pool = (payload.db as unknown as { pool: { query: (sql: string, values: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> } }).pool
  // ищем и по словарю (морфология), и по «простому» разбору — чтобы находились названия и аббревиатуры
  const match = `(
      (setweight(to_tsvector('${cfg}', coalesce(title,'')), 'A') || setweight(to_tsvector('${cfg}', coalesce(text,'')), 'B')) @@ to_tsquery('${cfg}', $2)
      or (to_tsvector('simple', coalesce(title,'')) || to_tsvector('simple', coalesce(text,''))) @@ to_tsquery('simple', $2)
    )`

  const counts = await pool.query(`select type, count(*)::int as n from search_index where locale = $1 and ${match} group by type`, [params.locale, tsq])
  const byType = new Map(counts.rows.map((r) => [String(r.type), Number(r.n)]))
  const rubrics = RUBRICS.map((r) => ({ id: r.id, name: r[params.locale], count: r.types.reduce((s, t) => s + (byType.get(t) ?? 0), 0) }))
  const rubric = RUBRICS.find((r) => r.id === params.rubric)
  const types = rubric ? rubric.types : RUBRICS.flatMap((r) => r.types)
  const total = types.reduce((s, t) => s + (byType.get(t) ?? 0), 0)

  const res = await pool.query(
    `select id, type, title, url, tags, date, left(coalesce(text,''), 40) as head,
        ts_headline('${cfg}', coalesce(text,''), to_tsquery('${cfg}', $2), 'StartSel=<mark>,StopSel=</mark>,MaxWords=40,MinWords=18,ShortWord=2,MaxFragments=1') as snippet,
        ts_headline('${cfg}', coalesce(title,''), to_tsquery('${cfg}', $2), 'StartSel=<mark>,StopSel=</mark>,HighlightAll=true') as title_hl
     from search_index
     where locale = $1 and type = any($3) and ${match}
     order by ts_rank_cd(setweight(to_tsvector('${cfg}', coalesce(title,'')), 'A') || setweight(to_tsvector('${cfg}', coalesce(text,'')), 'B'), to_tsquery('${cfg}', $2)) desc,
              date desc nulls last, id
     limit ${PAGE_SIZE} offset $4`,
    [params.locale, tsq, types, (page - 1) * PAGE_SIZE],
  )

  const labels = params.locale === 'en' ? TYPE_LABEL_EN : TYPE_LABEL_RU
  // в заголовке и сниппете оставляем только подсветку, остальное экранируем
  const safe = (s: string) => esc(s).replace(/&lt;mark&gt;/g, '<mark>').replace(/&lt;\/mark&gt;/g, '</mark>')
  const items = (res.rows as unknown as Row[]).map((r) => ({
    type: r.type,
    typeName: labels[r.type] ?? '',
    title: safe(r.title_hl || r.title),
    // фрагмент из середины текста начинается с многоточия
    description: `${r.snippet && !r.snippet.replace(/<\/?mark>/g, '').startsWith(r.head.slice(0, 20)) ? '…' : ''}${cutSnippet(safe(r.snippet || ''))}`,
    url: r.url,
    ...(Array.isArray(r.tags) && r.tags.length ? { tags: r.tags } : {}),
  }))

  return { query: q, total, page, pages: Math.ceil(total / PAGE_SIZE), rubrics, items }
}

/** Журнал запросов: пишем без ожидания, чтобы не замедлять поиск. */
export const logQuery = (payload: Payload, q: string, results: number, rubric: string | undefined, locale: Locale) => {
  if (!q.trim()) return
  void payload
    .create({ collection: 'search-queries', data: { query: q.trim().slice(0, 200).toLowerCase(), results, type: rubric ?? '', locale }, overrideAccess: true })
    .catch(() => undefined)
}
