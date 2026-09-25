/**
 * Разделы, которые собираются из коллекций: Центр экспертизы, публикации, каталог услуг,
 * вакансии и стажировки, партнёры. Ответы — в формате, который ждёт фронт (см. src/contract).
 */
import type { Payload, Where } from 'payload'

import type { Shape } from '../blocks/shape'
import { toFront, type ToFrontCtx } from '../blocks/transform'
import { vacancySectionsShape } from '../collections/Career'
import { bodyShape, PUBLICATION_TYPES } from '../collections/Expertise'
import { careerPageShape, catalogPageShape, expertisePageShape, partnersPageShape } from '../globals/sections'
import { buildCtx, type Locale } from './serialize'

type Doc = Record<string, any>
type Filters = Record<string, string[]>

const IMG: Shape = { kind: 'image', background: false }
const BG: Shape = { kind: 'image', background: true }

const PAGE_SIZE = { expertise: 14, services: 12, vacancies: 10, internships: 50, partners: 27 }

const T = {
  ru: {
    expertise: 'Центр экспертизы',
    catalog: 'Каталог услуг и решений',
    vacancies: 'Вакансии',
    internships: 'Стажировки',
    partners: 'Партнёры',
    sort: 'Сортировать по:',
    novelty: 'Новизне',
    recommend: 'Сначала рекомендуемое',
    search: 'Поиск...',
    serviceSearch: 'Найти услугу или решение...',
    vacancySearch: 'Введите должность или ключевое слово...',
    partnerSearch: 'Введите название партнера...',
    direction: 'Направление',
    industry: 'Отрасль',
    allPublications: 'Все публикации',
    city: 'Город',
    experience: 'Опыт работы',
    format: 'Формат работы',
    types: { news: 'Новость', article: 'Статья', journal: 'Статья из журнала', case: 'Кейсы' } as Record<string, string>,
    typesPlural: { news: 'Новости', article: 'Статьи', journal: 'Журнал Jet Info', case: 'Кейсы' } as Record<string, string>,
    related: 'Связанные услуги',
    similar: 'Похожие материалы',
    similarText: 'Последние новости, кейсы, релизы и экспертные материалы',
    allNews: 'Все материалы',
    similarJobs: 'Похожие вакансии',
    apply: 'Откликнуться',
    vacancy: 'Вакансия',
    internship: 'Стажировка',
    anyCity: 'Вся Россия',
    heroCity: 'Город',
    heroExperience: 'Опыт',
    heroDirection: 'Направление',
    months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  },
  en: {
    expertise: 'Center of expertise',
    catalog: 'Services and solutions',
    vacancies: 'Vacancies',
    internships: 'Internships',
    partners: 'Partners',
    sort: 'Sort by:',
    novelty: 'Newest',
    recommend: 'Recommended first',
    search: 'Search...',
    serviceSearch: 'Find a service or solution...',
    vacancySearch: 'Enter a position or keyword...',
    partnerSearch: 'Enter partner name...',
    direction: 'Direction',
    industry: 'Industry',
    allPublications: 'All publications',
    city: 'City',
    experience: 'Experience',
    format: 'Work format',
    types: { news: 'News', article: 'Article', journal: 'Jet Info article', case: 'Cases' } as Record<string, string>,
    typesPlural: { news: 'News', article: 'Articles', journal: 'Jet Info', case: 'Cases' } as Record<string, string>,
    related: 'Related services',
    similar: 'Similar materials',
    similarText: 'Latest news, cases, releases and expert materials',
    allNews: 'All materials',
    similarJobs: 'Similar vacancies',
    apply: 'Apply',
    vacancy: 'Vacancy',
    internship: 'Internship',
    anyCity: 'All of Russia',
    heroCity: 'City',
    heroExperience: 'Experience',
    heroDirection: 'Direction',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
}

const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as Doc).id : v)
const ids = (v: unknown) => (Array.isArray(v) ? v.map(idOf).filter((x) => x !== null && x !== undefined) : [])

export const formatDate = (iso: string | null | undefined, locale: Locale) => {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return `${d.getUTCDate()} ${T[locale].months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Значения фильтров из запроса: вложенные группы формы разворачиваются, строки через запятую — в списки. */
export const readFilters = (input: unknown, out: Filters = {}): Filters => {
  if (!input || typeof input !== 'object') return out
  for (const [key, value] of Object.entries(input as Doc)) {
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) out[key] = value.map(String).filter(Boolean)
    else if (typeof value === 'object') readFilters(value, out)
    else out[key] = String(value).split(',').map((s) => s.trim()).filter(Boolean)
  }
  return out
}

const first = (f: Filters, key: string) => f[key]?.[0]
const pageOf = (f: Filters) => Math.max(1, parseInt(first(f, 'page') ?? '1', 10) || 1)
const paginate = <X>(items: X[], page: number, size: number) => ({
  total: Math.max(1, Math.ceil(items.length / size)),
  items: items.slice((page - 1) * size, page * size),
})

const findAll = async (payload: Payload, collection: string, locale: Locale, where: Where = {}, sort?: string) =>
  (
    await payload.find({
      collection: collection as never,
      where,
      locale,
      depth: 0,
      limit: 1000,
      pagination: false,
      sort,
      draft: false,
      overrideAccess: true,
    })
  ).docs.filter((d) => {
    // записи без перевода на этот язык на сайте не показываем
    const title = (d as Doc).title
    return typeof title === 'string' && title.trim() !== ''
  }) as Doc[]

const published: Where = { _status: { equals: 'published' } }

const byId = (docs: Doc[]) => new Map(docs.map((d) => [String(d.id), d]))

const matchText = (text: string | undefined, ...values: unknown[]) => {
  if (!text) return true
  const q = text.toLowerCase()
  return values.some((v) => typeof v === 'string' && v.replace(/<[^>]+>/g, '').toLowerCase().includes(q))
}

const option = (title: string, value: string, count?: number) => (count === undefined ? { title, value } : { title, value, count })

const global = async (payload: Payload, slug: string, locale: Locale) =>
  (await payload.findGlobal({ slug: slug as never, locale, depth: 0, overrideAccess: true })) as Doc

/** Тексты раздела из «Разделов сайта» в формате фронта. */
const sectionData = async (payload: Payload, slug: string, shape: Shape, locale: Locale) => {
  const doc = await global(payload, slug, locale)
  const ctx = await buildCtx(payload, [{ shape, value: doc }], locale)
  return { doc, data: (toFront(shape, doc, ctx) ?? {}) as Doc }
}

const pageMeta = (doc: Doc, fallback: string, variant?: string) => {
  const m = doc.meta ?? {}
  const items: Doc[] = []
  if (m.crumbParentTitle) items.push(m.crumbParentUrl ? { title: m.crumbParentTitle, url: m.crumbParentUrl } : { title: m.crumbParentTitle })
  items.push({ title: m.crumb || fallback })
  const crumbs: Doc = { items }
  const v = m.crumbVariant && m.crumbVariant !== 'default' ? m.crumbVariant : variant
  if (v) crumbs.variant = v
  const seo: Doc = { title: m.seoTitle || fallback }
  if (m.seoDescription) seo.description = m.seoDescription
  return { breadcrumbs: crumbs, seo }
}

const imageCtx = async (payload: Payload, locale: Locale, values: { shape: Shape; value: unknown }[]) => buildCtx(payload, values, locale)

// ————————————————————————————— Центр экспертизы —————————————————————————————

type Lookups = { directions: Map<string, Doc>; industries: Map<string, Doc>; terms: Map<string, Doc> }

const lookups = async (payload: Payload, locale: Locale): Promise<Lookups> => {
  const [directions, industries, terms] = await Promise.all([
    findAll(payload, 'directions', locale, {}, 'order'),
    findAll(payload, 'industries', locale, {}, 'order'),
    findAll(payload, 'terms', locale, {}, 'order'),
  ])
  return { directions: byId(directions), industries: byId(industries), terms: byId(terms) }
}

const tagTitles = (doc: Doc, lk: Lookups) =>
  [
    ...ids(doc.directions).map((id) => lk.directions.get(String(id))?.title),
    ...ids(doc.industries).map((id) => lk.industries.get(String(id))?.title),
    ...ids(doc.universal).map((id) => lk.terms.get(String(id))?.title),
  ].filter(Boolean) as string[]

const publicationCard = (doc: Doc, lk: Lookups, ctx: ToFrontCtx, locale: Locale) => {
  const card: Doc = { tag: T[locale].types[doc.type] ?? '', title: doc.title }
  if (doc.description) card.description = doc.description
  card.slug = doc.slug
  const tags = tagTitles(doc, lk)
  if (tags.length) card.tags = tags
  const cover = toFront(IMG, doc.cover, ctx)
  if (cover) card.background = cover
  if (doc.type === 'journal') card.type = 'jet'
  return card
}

const projectCard = (doc: Doc, lk: Lookups, ctx: ToFrontCtx) => {
  const card: Doc = { title: doc.title }
  if (doc.supTag) card.supTag = doc.supTag
  const tag = doc.tag || lk.directions.get(String(ids(doc.directions)[0]))?.title
  if (tag) card.tag = tag
  if (doc.secondTitle) card.secondTitle = doc.secondTitle
  if (doc.description) card.description = doc.description
  const company = toFront(IMG, doc.company, ctx)
  if (company) card.company = company
  const stats = (doc.stats ?? []).filter((s: Doc) => s.title && s.description).map((s: Doc) => ({ title: s.title, description: s.description }))
  if (stats.length) card.stats = stats
  if (doc.btn?.title && doc.btn?.url) card.btn = { title: doc.btn.title, url: doc.btn.url }
  card.type = 'case'
  return card
}

const hasAny = (doc: Doc, field: string, wanted: Set<string>) => wanted.size === 0 || ids(doc[field]).some((id) => wanted.has(String(id)))

const codesToIds = (codes: string[] | undefined, map: Map<string, Doc>) =>
  new Set([...map.values()].filter((d) => codes?.includes(d.code)).map((d) => String(d.id)))

const expertiseItems = async (payload: Payload, locale: Locale, f: Filters, lk: Lookups) => {
  const types = new Set(f.allPublications ?? [])
  const wantDirections = codesToIds(f.direction, lk.directions)
  const wantIndustries = codesToIds(f.industry, lk.industries)
  const text = first(f, 'text')
  const [pubs, projects] = await Promise.all([
    types.size && ![...types].some((t) => t !== 'case') ? [] : findAll(payload, 'publications', locale, published),
    types.size && !types.has('case') ? [] : findAll(payload, 'projects', locale, { and: [published, { hideInGrid: { not_equals: true } }] }),
  ])
  const all = [
    ...pubs.filter((d) => !types.size || types.has(d.type)).map((d) => ({ kind: 'pub' as const, doc: d })),
    ...projects.map((d) => ({ kind: 'project' as const, doc: d })),
  ].filter(({ doc }) => hasAny(doc, 'directions', wantDirections) && hasAny(doc, 'industries', wantIndustries) && matchText(text, doc.title, doc.description))

  const recommendFirst = first(f, 'sort') === 'recommend'
  all.sort((a, b) => {
    if (recommendFirst) {
      const r = Number(!!b.doc.recommended) - Number(!!a.doc.recommended)
      if (r) return r
      const p = (b.doc.priority ?? 0) - (a.doc.priority ?? 0)
      if (p) return p
    }
    return String(b.doc.date ?? '').localeCompare(String(a.doc.date ?? ''))
  })
  const { total, items } = paginate(all, pageOf(f), PAGE_SIZE.expertise)
  const ctx = await imageCtx(payload, locale, items.map(({ kind, doc }) => ({ shape: IMG, value: kind === 'pub' ? doc.cover : doc.company })))
  return { total, items: items.map(({ kind, doc }) => (kind === 'pub' ? publicationCard(doc, lk, ctx, locale) : projectCard(doc, lk, ctx))) }
}

const expertiseForm = (lk: Lookups, locale: Locale) => {
  const t = T[locale]
  return {
    fields: [
      { id: 'sort', name: 'sort', label: t.sort, type: 'sorting', options: [option(t.novelty, 'novelty'), option(t.recommend, 'recommend')] },
      {
        id: 'search',
        name: 'search',
        type: 'groupSearch',
        fields: [
          { id: 'text', name: 'text', placeholder: t.search, type: 'inputSearch' },
          {
            id: 'types',
            name: 'types',
            type: 'groupSearchSelect',
            fields: [
              { id: 'direction', name: 'direction', placeholder: t.direction, type: 'selectSearchItemMulti', items: [...lk.directions.values()].map((d) => option(d.title, d.code)) },
              { id: 'industry', name: 'industry', placeholder: t.industry, type: 'selectSearchItemMulti', items: [...lk.industries.values()].map((d) => option(d.title, d.code)) },
              {
                id: 'allPublications',
                name: 'allPublications',
                placeholder: t.allPublications,
                type: 'selectSearchItemMulti',
                items: [...PUBLICATION_TYPES.map((p) => option(t.typesPlural[p.value], p.value)), option(t.typesPlural.case, 'case')],
              },
            ],
          },
        ],
      },
    ],
  }
}

export const expertisePage = async (payload: Payload, locale: Locale, query: unknown) => {
  const f = readFilters(query)
  const [lk, section] = await Promise.all([lookups(payload, locale), sectionData(payload, 'expertise-page', expertisePageShape, locale)])
  const list = await expertiseItems(payload, locale, f, lk)
  const data: Doc = { ...pageMeta(section.doc, T[locale].expertise), ...section.data }
  data.expertiseElector = { ...(section.data.expertiseElector ?? {}), form: expertiseForm(lk, locale), total: list.total, items: list.items }
  return { status: 'success', data }
}

export const expertiseFilter = async (payload: Payload, locale: Locale, body: unknown) =>
  expertiseItems(payload, locale, readFilters(body), await lookups(payload, locale))

export const publicationPage = async (payload: Payload, locale: Locale, slug: string) => {
  const found = await findAll(payload, 'publications', locale, { and: [published, { slug: { equals: slug } }] })
  const doc = found[0]
  if (!doc) return null
  const [lk, section] = await Promise.all([lookups(payload, locale), sectionData(payload, 'expertise-page', expertisePageShape, locale)])
  const t = T[locale]

  // похожие: выбранные вручную или с общими тегами, свежие первыми
  let similar: Doc[] = []
  const manual = ids(doc.similar).map(String)
  if (manual.length) {
    similar = (await findAll(payload, 'publications', locale, { and: [published, { id: { in: manual } }] }))
  } else {
    const all = await findAll(payload, 'publications', locale, { and: [published, { id: { not_equals: doc.id } }] }, '-date')
    const mine = new Set([...ids(doc.directions), ...ids(doc.industries), ...ids(doc.universal)].map(String))
    similar = all.filter((d) => [...ids(d.directions), ...ids(d.industries), ...ids(d.universal)].some((id) => mine.has(String(id)))).slice(0, 6)
  }
  const services = ids(doc.relatedServices).length
    ? await findAll(payload, 'services', locale, { id: { in: ids(doc.relatedServices).map(String) } })
    : []

  const ctx = await buildCtx(
    payload,
    [{ shape: BG, value: doc.background }, { shape: bodyShape, value: doc }, ...similar.map((d) => ({ shape: IMG, value: d.cover }))],
    locale,
  )
  const newsDetail: Doc = { hash: '#news-detail' }
  const bg = toFront(BG, doc.background, ctx)
  if (bg) newsDetail.background = bg
  newsDetail.tag = t.types[doc.type] ?? ''
  const tags = tagTitles(doc, lk)
  if (tags.length) newsDetail.tags = tags
  const date = formatDate(doc.date, locale)
  if (date) newsDetail.date = date
  newsDetail.title = doc.title
  newsDetail.items = ((toFront(bodyShape, doc, ctx) as Doc | undefined)?.items ?? []) as unknown[]

  const data: Doc = {
    breadcrumbs: { items: [{ title: section.doc.meta?.crumb || t.expertise, url: '/expertise/' }, { title: doc.title.replace(/<[^>]+>/g, '') }] },
    seo: { title: doc.seo?.title || doc.title.replace(/<[^>]+>/g, ''), ...(doc.seo?.description ? { description: doc.seo.description } : {}), ...(doc.seo?.keywords ? { keywords: doc.seo.keywords } : {}) },
    newsDetail,
  }
  if (services.length) {
    data.services = { hash: '#services', title: t.related, items: services.map((s) => ({ title: s.title, ...(s.description ? { description: s.description } : {}), slug: s.slug })) }
  }
  if (similar.length >= 2) {
    data.similar = {
      hash: '#similar',
      title: t.similar,
      description: t.similarText,
      btn: { title: t.allNews, url: '/expertise/' },
      items: similar.map((d) => publicationCard(d, lk, ctx, locale)),
    }
  }
  if (section.data.callback) data.callback = section.data.callback
  return { status: 'success', data }
}

// ————————————————————————————— Каталог услуг —————————————————————————————

const catalogItems = async (payload: Payload, locale: Locale, f: Filters) => {
  const [directions, subdirections, services] = await Promise.all([
    findAll(payload, 'directions', locale, {}, 'order'),
    findAll(payload, 'subdirections', locale, {}, 'order'),
    findAll(payload, 'services', locale, {}, 'order'),
  ])
  const text = first(f, 'text')
  const dirCode = first(f, 'direction')
  const groups = directions
    .filter((d) => !dirCode || d.code === dirCode)
    .map((d) => {
      const mine = services.filter((s) => String(idOf(s.direction)) === String(d.id) && matchText(text, s.title, s.description))
      const card = (s: Doc) => ({ title: s.title, ...(s.description ? { description: s.description } : {}), slug: s.slug })
      const bySub = subdirections
        .filter((sd) => String(idOf(sd.direction)) === String(d.id))
        .map((sd) => ({ title: sd.title, cardItems: mine.filter((s) => String(idOf(s.subdirection)) === String(sd.id)).map(card) }))
        .filter((g) => g.cardItems.length)
      const loose = mine.filter((s) => !s.subdirection).map(card)
      const items = [...(loose.length ? [{ cardItems: loose }] : []), ...bySub]
      return { title: d.title, items }
    })
    .filter((g) => g.items.length)
  return paginate(groups, pageOf(f), PAGE_SIZE.services)
}

export const catalogPage = async (payload: Payload, locale: Locale, query: unknown) => {
  const f = readFilters(query)
  const [section, list, directions] = await Promise.all([
    sectionData(payload, 'catalog-page', catalogPageShape, locale),
    catalogItems(payload, locale, f),
    findAll(payload, 'directions', locale, {}, 'order'),
  ])
  const t = T[locale]
  const form = {
    fields: [
      {
        id: 'text',
        name: 'text',
        type: 'groupSearch',
        fields: [
          { id: 'text', name: 'text', placeholder: t.serviceSearch, type: 'inputSearch' },
          { id: 'types', name: 'types', type: 'groupSearchSelect', fields: [{ id: 'direction', name: 'direction', placeholder: t.direction, type: 'selectSearchItem', items: directions.map((d) => option(d.title, d.code)) }] },
        ],
      },
    ],
  }
  const data: Doc = { ...pageMeta(section.doc, t.catalog), ...section.data }
  data.catalog = { ...(section.data.catalog ?? { title: t.catalog }), form, total: list.total, items: list.items }
  if (!data.catalog.title) data.catalog.title = t.catalog
  return { status: 'success', data }
}

export const catalogFilter = async (payload: Payload, locale: Locale, body: unknown) => catalogItems(payload, locale, readFilters(body))

// ————————————————————————————— Вакансии и стажировки —————————————————————————————

const activeVacancy = (kind: 'vacancy' | 'internship'): Where => ({
  and: [published, { kind: { equals: kind } }, { or: [{ closeAt: { exists: false } }, { closeAt: { greater_than: new Date().toISOString() } }] }],
})

const jobCard = (doc: Doc, terms: Map<string, Doc>, locale: Locale) => {
  const t = T[locale]
  const title = (id: unknown) => terms.get(String(idOf(id)))?.title as string | undefined
  const card: Doc = {}
  const tag = title(doc.tag)
  if (tag) card.tag = tag
  // в карточке заголовок выводится текстом, перенос строки из заголовка страницы превращаем в пробел
  card.title = String(doc.title).replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim()
  const items = [title(doc.city) ?? t.anyCity, title(doc.experience), title(doc.workFormat)].filter(Boolean)
  if (items.length) card.items = items
  card.slug = doc.slug
  card.btn = { title: t.apply }
  return card
}

const jobsItems = async (payload: Payload, locale: Locale, kind: 'vacancy' | 'internship', f: Filters, terms: Map<string, Doc>) => {
  const docs = await findAll(payload, 'vacancies', locale, activeVacancy(kind), '-createdAt')
  const want = (key: string) => codesToIds(f[key], terms)
  const [city, experience, format, tag] = ['city', 'experience', 'format', 'tag'].map(want)
  const text = first(f, 'text')
  const match = (doc: Doc, field: string, set: Set<string>) => set.size === 0 || set.has(String(idOf(doc[field])))
  const filtered = docs.filter(
    (d) => match(d, 'city', city) && match(d, 'experience', experience) && match(d, 'workFormat', format) && match(d, 'tag', tag) && matchText(text, d.title),
  )
  const size = kind === 'vacancy' ? PAGE_SIZE.vacancies : PAGE_SIZE.internships
  const { total, items } = paginate(filtered, pageOf(f), size)
  return { all: docs, count: filtered.length, total, items: items.map((d) => jobCard(d, terms, locale)) }
}

const termOptions = (terms: Map<string, Doc>, kind: string, docs: Doc[], field: string) =>
  [...terms.values()]
    .filter((x) => x.kind === kind)
    .map((x) => option(x.title, x.code, docs.filter((d) => String(idOf(d[field])) === String(x.id)).length))

export const jobsPage = async (payload: Payload, locale: Locale, kind: 'vacancy' | 'internship', query: unknown) => {
  const f = readFilters(query)
  const t = T[locale]
  const terms = (await lookups(payload, locale)).terms
  const [section, list] = await Promise.all([sectionData(payload, 'career-page', careerPageShape, locale), jobsItems(payload, locale, kind, f, terms)])
  const view = (kind === 'vacancy' ? section.data.vacancies : section.data.internships) ?? {}
  const jobs: Doc = { ...view, count: list.count, items: list.items }
  if (kind === 'vacancy') {
    jobs.total = list.total
    jobs.form = {
      fields: [
        {
          id: 'search',
          name: 'search',
          type: 'groupSearch',
          fields: [
            { id: 'text', name: 'text', placeholder: t.vacancySearch, type: 'inputSearch' },
            {
              id: 'types',
              name: 'types',
              type: 'groupSearchSelect',
              fields: [
                { id: 'city', name: 'city', placeholder: t.city, type: 'selectSearchItemMulti', items: termOptions(terms, 'city', list.all, 'city').map(({ title, value }) => option(title, value)) },
                { id: 'experience', name: 'experience', placeholder: t.experience, type: 'selectSearchItemMulti', items: termOptions(terms, 'experience', list.all, 'experience').map(({ title, value }) => option(title, value)) },
                { id: 'format', name: 'format', placeholder: t.format, type: 'selectSearchItemMulti', items: termOptions(terms, 'workFormat', list.all, 'workFormat').map(({ title, value }) => option(title, value)) },
              ],
            },
          ],
        },
        { id: 'tag', name: 'tag', type: 'tags', items: termOptions(terms, 'vacancyTag', list.all, 'tag') },
      ],
    }
  }
  const title = kind === 'vacancy' ? t.vacancies : t.internships
  return { status: 'success', data: { ...pageMeta(section.doc, title, 'breadcrumbs_blue'), jobs } }
}

export const jobsFilter = async (payload: Payload, locale: Locale, body: unknown) => {
  const f = readFilters(body)
  const terms = (await lookups(payload, locale)).terms
  const kind = first(f, 'kind') === 'internship' ? 'internship' : 'vacancy'
  const { total, items } = await jobsItems(payload, locale, kind, f, terms)
  return { total, items }
}

export const jobsCommon = async (payload: Payload, locale: Locale) => {
  const section = await sectionData(payload, 'career-page', careerPageShape, locale)
  return { status: 'success', data: section.data.callback ? { callback: section.data.callback } : {} }
}

export const jobPage = async (payload: Payload, locale: Locale, kind: 'vacancy' | 'internship', slug: string) => {
  const found = await findAll(payload, 'vacancies', locale, { and: [activeVacancy(kind), { slug: { equals: slug } }] })
  const doc = found[0]
  if (!doc) return null
  const t = T[locale]
  const terms = (await lookups(payload, locale)).terms
  const section = await sectionData(payload, 'career-page', careerPageShape, locale)
  const title = (id: unknown) => terms.get(String(idOf(id)))?.title as string | undefined

  let similar: Doc[] = []
  const manual = ids(doc.similar).map(String)
  const all = await findAll(payload, 'vacancies', locale, activeVacancy(kind), '-createdAt')
  if (manual.length) similar = all.filter((d) => manual.includes(String(d.id)))
  else {
    const others = all.filter((d) => d.id !== doc.id)
    const same = (d: Doc, f: string) => idOf(d[f]) && String(idOf(d[f])) === String(idOf(doc[f]))
    similar = [...others.filter((d) => same(d, 'tag') || same(d, 'city')), ...others.filter((d) => !(same(d, 'tag') || same(d, 'city')))].slice(0, 4)
  }

  const ctx = await buildCtx(payload, [{ shape: BG, value: doc.background }, { shape: vacancySectionsShape, value: doc }], locale)
  const hero: Doc = { hash: '#hero', tag: kind === 'vacancy' ? t.vacancy : t.internship, title: doc.title, btn: { title: t.apply }, hashToScroll: '#callback' }
  hero.background = toFront(BG, doc.background, ctx) ?? { src: '' }
  hero.items = [
    { title: t.heroCity, value: title(doc.city) ?? t.anyCity },
    ...(title(doc.experience) ? [{ title: t.heroExperience, value: title(doc.experience) }] : []),
    ...(title(doc.tag) ? [{ title: t.heroDirection, value: title(doc.tag) }] : []),
  ]
  const data: Doc = {
    breadcrumbs: { variant: 'breadcrumbs_blue', items: [{ title: kind === 'vacancy' ? t.vacancies : t.internships, url: kind === 'vacancy' ? '/vacancies/' : '/internships/' }, { title: doc.title.replace(/<[^>]+>/g, ' ') }] },
    seo: { title: doc.seo?.title || doc.title.replace(/<[^>]+>/g, ' ') },
    hero,
    ...((toFront(vacancySectionsShape, doc, ctx) as Doc | undefined) ?? {}),
  }
  if (similar.length) data.similar = { hash: '#similar', title: t.similarJobs, hashToScroll: '#callback', items: similar.map((d) => jobCard(d, terms, locale)) }
  data.callback = section.data.callback ?? { form: { visible: [] } }
  return { status: 'success', data }
}

// ————————————————————————————— Партнёры —————————————————————————————

const partnerItems = async (payload: Payload, locale: Locale, f: Filters, lk: Lookups) => {
  const docs = await findAll(payload, 'partners', locale, {}, 'order')
  const text = first(f, 'text')
  const want = codesToIds(f.direction, lk.directions)
  const filtered = docs.filter((d) => hasAny(d, 'directions', want) && matchText(text, d.title))
  const { total, items } = paginate(filtered, pageOf(f), PAGE_SIZE.partners)
  const ctx = await imageCtx(payload, locale, items.map((d) => ({ shape: IMG, value: d.logo })))
  return {
    count: filtered.length,
    total,
    items: items.map((d) => {
      const card: Doc = { title: d.title }
      const type = lk.terms.get(String(idOf(d.type)))?.title
      if (type) card.description = type
      const img = toFront(IMG, d.logo, ctx)
      if (img) card.img = img
      const points = (d.items ?? []).map((i: Doc) => i.value).filter(Boolean)
      if (points.length) card.items = points
      return card
    }),
  }
}

export const partnersPage = async (payload: Payload, locale: Locale, query: unknown) => {
  const f = readFilters(query)
  const lk = await lookups(payload, locale)
  const [section, list] = await Promise.all([sectionData(payload, 'partners-page', partnersPageShape, locale), partnerItems(payload, locale, f, lk)])
  const t = T[locale]
  const form = {
    fields: [
      {
        id: 'search',
        name: 'search',
        type: 'groupSearch',
        fields: [
          { id: 'text', name: 'text', placeholder: t.partnerSearch, type: 'inputSearch' },
          { id: 'types', name: 'types', type: 'groupSearchSelect', fields: [{ id: 'direction', name: 'direction', placeholder: t.direction, type: 'selectSearchItem', items: [...lk.directions.values()].map((d) => option(d.title, d.code)) }] },
        ],
      },
    ],
  }
  const data: Doc = { ...pageMeta(section.doc, t.partners), ...section.data }
  data.companions = { title: section.data.companions?.title ?? t.partners, form, count: list.count, total: list.total, items: list.items }
  return { status: 'success', data }
}

export const partnersFilter = async (payload: Payload, locale: Locale, body: unknown) => {
  const { total, items } = await partnerItems(payload, locale, readFilters(body), await lookups(payload, locale))
  return { total, items }
}
