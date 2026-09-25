/**
 * Импорт тестовых данных фронта в коллекции: справочники, направления, отрасли, услуги,
 * публикации и проекты, вакансии и стажировки, партнёры, тексты разделов.
 * Повторный запуск обновляет записи (ищет по коду или символьному коду), а не дублирует их.
 */
import type { Payload } from 'payload'

import { fromFront, type FromFrontCtx } from '../blocks/transform'
import type { Shape } from '../blocks/shape'
import { vacancySectionsShape } from '../collections/Career'
import { bodyShape } from '../collections/Expertise'
import { slugify } from '../collections/shared'
import { careerPageShape, catalogPageShape, expertisePageShape, partnersPageShape } from '../globals/sections'
import { type Json, type Locale, makeCtx, readJson } from './fixture-utils'

type Id = number | string
type Item = { title: string; value: string; count?: number }
type Field = { name?: string; items?: Item[]; options?: Item[]; fields?: Field[] }

const IMG: Shape = { kind: 'image', background: false }
const BG: Shape = { kind: 'image', background: true }

const findField = (fields: Field[] | undefined, name: string): Field | undefined => {
  for (const f of fields ?? []) {
    if (f.name === name && (f.items || f.options)) return f
    const inner = findField(f.fields, name)
    if (inner) return inner
  }
  return undefined
}
const itemsOf = (form: Json | undefined, name: string) => findField((form?.fields as Field[]) ?? [], name)?.items ?? []

const clean = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

/** Создаёт или обновляет запись, найденную по полю where. */
const upsert = async (payload: Payload, collection: string, where: Json, data: Json, locale: Locale = 'ru'): Promise<Id> => {
  const found = await payload.find({ collection: collection as never, where: where as never, limit: 1, depth: 0, draft: true, locale })
  const doc = found.docs[0] as { id: Id } | undefined
  if (doc) {
    await payload.update({ collection: collection as never, id: doc.id, data: data as never, locale })
    return doc.id
  }
  const created = (await payload.create({ collection: collection as never, data: data as never, locale })) as { id: Id }
  return created.id
}

export const importCollections = async (payload: Payload) => {
  const log = (m: string) => payload.logger.info(m)
  const ctx: FromFrontCtx = makeCtx(payload, 'Форма из тестовых данных')
  const img = async (v: unknown, shape: Shape = IMG) => (v ? fromFront(shape, v, ctx) : undefined)

  const expertise = (await readJson('expertise.json'))?.data as Json
  const services = (await readJson('services.json'))?.data as Json
  const vacancies = (await readJson('vacancies.json'))?.data as Json
  const internships = (await readJson('internships.json'))?.data as Json
  const partners = (await readJson('about/partners.json'))?.data as Json
  const jobs = (await readJson('jobs.json'))?.data as Json
  const elector = expertise.expertiseElector as Json
  const catalog = services.catalog as Json
  const jobsList = vacancies.jobs as Json

  // ——— справочники ———
  const directionIds = new Map<string, Id>() // по названию
  // направления: из фильтра каталога и из групп каталога, без повторов по названию
  const directionList = [
    ...itemsOf(catalog.form as Json, 'direction').map((d) => ({ title: clean(d.title), code: d.value.toLowerCase() })),
    ...((catalog.items as Json[]) ?? []).map((g) => ({ title: clean(String(g.title)), code: slugify(String(g.title)) })),
  ]
  for (const [i, d] of directionList.entries()) {
    if (directionIds.has(d.title)) continue
    const id = await upsert(payload, 'directions', { code: { equals: d.code } }, { title: d.title, code: d.code, order: (i + 1) * 10 })
    directionIds.set(d.title, id)
  }
  const industryIds = new Map<string, Id>()
  const seenIndustry = new Set<string>()
  for (const [i, d] of itemsOf(elector.form as Json, 'industry').entries()) {
    if (seenIndustry.has(d.value)) continue
    seenIndustry.add(d.value)
    const id = await upsert(payload, 'industries', { code: { equals: d.value.toLowerCase() } }, { title: clean(d.title), code: d.value.toLowerCase(), order: (i + 1) * 10 })
    if (!industryIds.has(clean(d.title))) industryIds.set(clean(d.title), id)
  }
  const termIds = new Map<string, Id>() // kind:title
  const term = async (kind: string, title: string, code?: string, order = 100) => {
    const key = `${kind}:${clean(title)}`
    if (termIds.has(key)) return termIds.get(key) as Id
    const c = code && /^[a-z0-9_-]+$/.test(code.toLowerCase()) ? code.toLowerCase() : slugify(title) || `t${termIds.size}`
    const id = await upsert(payload, 'terms', { and: [{ kind: { equals: kind } }, { code: { equals: `${c}` } }] }, { kind, title: clean(title), code: c, order })
    termIds.set(key, id)
    return id
  }
  const vForm = jobsList.form as Json
  for (const [i, x] of itemsOf(vForm, 'direction').entries()) await term('city', x.title, slugify(x.title), i)
  for (const [i, x] of itemsOf(vForm, 'industry').entries()) await term('experience', x.title, slugify(x.title), i)
  for (const [i, x] of itemsOf(vForm, 'allPublications').entries()) await term('workFormat', x.title, slugify(x.title), i)
  for (const [i, x] of itemsOf(vForm, 'type').entries()) await term('vacancyTag', x.title, x.value, i)
  log('Справочники, направления и отрасли загружены')

  /** Теги публикации: название → направление, отрасль или универсальный тег. */
  const tagsOf = async (tags: unknown) => {
    const out = { directions: [] as Id[], industries: [] as Id[], universal: [] as Id[] }
    for (const t of (Array.isArray(tags) ? tags : []).slice(0, 3)) {
      const title = clean(String(t))
      if (directionIds.has(title)) out.directions.push(directionIds.get(title) as Id)
      else if (industryIds.has(title)) out.industries.push(industryIds.get(title) as Id)
      else {
        // незнакомую отрасль из тестовых карточек заводим как отрасль, остальное — универсальным тегом
        const code = slugify(title)
        const id = await upsert(payload, 'industries', { code: { equals: code } }, { title, code, order: 500 })
        industryIds.set(title, id)
        out.industries.push(id)
      }
    }
    return out
  }

  // ——— каталог услуг ———
  const serviceIds = new Map<string, Id>() // по slug
  const serviceGrid: { sub?: Id; cards: Id[] }[][] = [] // [группа][подгруппа] — для английских названий
  for (const group of (catalog.items as Json[]) ?? []) {
    const directionId = directionIds.get(clean(String(group.title)))
    const gridRow: { sub?: Id; cards: Id[] }[] = []
    serviceGrid.push(gridRow)
    if (!directionId) continue
    for (const [si, sub] of ((group.items as Json[]) ?? []).entries()) {
      let subId: Id | undefined
      if (sub.title) {
        subId = await upsert(payload, 'subdirections', { and: [{ title: { equals: sub.title } }, { direction: { equals: directionId } }] }, { title: sub.title, direction: directionId, order: si * 10 })
      }
      const cell = { sub: subId, cards: [] as Id[] }
      gridRow.push(cell)
      for (const [ci, card] of ((sub.cardItems as Json[]) ?? []).entries()) {
        const slug = String(card.slug)
        // одна и та же тестовая услуга встречается в нескольких группах — делаем код уникальным
        const unique = serviceIds.has(slug) ? `${slug}-${directionId}-${si}-${ci}` : slug
        const id = await upsert(payload, 'services', { slug: { equals: unique } }, {
          title: card.title,
          description: card.description ?? null,
          direction: directionId,
          subdirection: subId ?? null,
          slug: unique,
          order: si * 100 + ci,
        })
        serviceIds.set(unique, id)
        cell.cards.push(id)
      }
    }
  }
  log(`Услуг: ${serviceIds.size}`)

  // ——— публикации и проекты ———
  const detail = (await readJson('expertise/news-1.json'))?.data as Json
  const news = detail.newsDetail as Json
  const typeOf = (tag: string) => (/журнал/i.test(tag) ? 'journal' : /стать/i.test(tag) ? 'article' : 'news')
  const slugs = new Map<string, number>()
  const uniqSlug = (slug: string) => {
    const n = (slugs.get(slug) ?? 0) + 1
    slugs.set(slug, n)
    return n === 1 ? slug : `${slug}-${n}`
  }
  const cards = (elector.items as Json[]) ?? []
  const pubIds: Id[] = []
  const cardIds: { collection: 'publications' | 'projects'; id: Id }[] = []
  const day = 24 * 60 * 60 * 1000
  for (const [i, card] of cards.entries()) {
    const date = new Date(Date.UTC(2025, 7, 1) - i * day).toISOString()
    if (card.type === 'case') {
      await upsert(payload, 'projects', { priority: { equals: i } }, {
        title: card.title,
        supTag: card.supTag ?? null,
        tag: card.tag ?? null,
        secondTitle: card.secondTitle ?? null,
        description: card.description ?? null,
        company: await img(card.company),
        stats: card.stats ?? [],
        btn: card.btn ?? {},
        date,
        priority: i,
        _status: 'published',
      }).then((id) => {
        cardIds.push({ collection: 'projects', id })
        return id
      })
      continue
    }
    const slug = uniqSlug(String(card.slug ?? slugify(String(card.title))))
    const isDetail = slug === 'news-1'
    const tags = await tagsOf(isDetail ? news.tags : card.tags)
    const data: Json = {
      type: typeOf(String(card.tag ?? '')),
      title: isDetail ? news.title : card.title,
      description: card.description ?? null,
      slug,
      date: isDetail ? new Date(Date.UTC(2025, 7, 1)).toISOString() : date,
      cover: await img(card.background),
      ...tags,
      _status: 'published',
    }
    if (isDetail) {
      data.background = await img(news.background, BG)
      Object.assign(data, (await fromFront(bodyShape, { items: news.items }, ctx)) as Json)
      const related = (((detail.services as Json)?.items as Json[]) ?? []).map((s) => serviceIds.get(String(s.slug))).filter(Boolean)
      data.relatedServices = related
    }
    const pubId = await upsert(payload, 'publications', { slug: { equals: slug } }, data)
    pubIds.push(pubId)
    cardIds.push({ collection: 'publications', id: pubId })
  }
  // похожие для детальной публикации — как в тестовых данных, несколько других карточек
  if (pubIds.length > 2 && (detail.similar as Json)?.items) {
    const count = Math.min(((detail.similar as Json).items as Json[]).length, pubIds.length - 1)
    await payload.update({ collection: 'publications', id: pubIds[0], data: { similar: pubIds.slice(1, count + 1) } as never })
  }
  log(`Публикаций: ${pubIds.length}`)

  // ——— вакансии и стажировки ———
  const jobIds: Record<string, Id[]> = { vacancy: [], internship: [] }
  const termEn = new Map<Id, string>() // английские названия справочников
  const jobCards = async (list: Json[], kind: 'vacancy' | 'internship', detailFile: string) => {
    const full = (await readJson(detailFile))?.data as Json | undefined
    const seen = new Map<string, number>()
    for (const card of list) {
      const [city, experience, format] = (card.items as string[]) ?? []
      const n = (seen.get(String(card.slug)) ?? 0) + 1
      seen.set(String(card.slug), n)
      const slug = n === 1 ? String(card.slug) : `${card.slug}-${n}`
      const data: Json = {
        kind,
        title: card.title,
        slug,
        tag: card.tag ? await term('vacancyTag', String(card.tag)) : null,
        city: city && !/вся россия/i.test(city) ? await term('city', city) : null,
        experience: experience ? await term('experience', experience) : null,
        workFormat: format ? await term('workFormat', format) : null,
        _status: 'published',
      }
      if (full && full.hero && slug === `${kind === 'vacancy' ? 'vacancy' : 'internship'}-1`) {
        const hero = full.hero as Json
        data.title = hero.title
        data.background = await img(hero.background, BG)
        Object.assign(data, (await fromFront(vacancySectionsShape, full, ctx)) as Json)
      }
      jobIds[kind].push(await upsert(payload, 'vacancies', { and: [{ slug: { equals: slug } }, { kind: { equals: kind } }] }, data))
    }
  }
  await jobCards((jobsList.items as Json[]) ?? [], 'vacancy', 'vacancies/vacancy-1.json')
  await jobCards(((internships.jobs as Json)?.items as Json[]) ?? [], 'internship', 'internships/internship-1.json')
  log('Вакансии и стажировки загружены')

  // ——— партнёры ———
  const companions = partners.companions as Json
  const partnerIds: Id[] = []
  for (const [i, p] of ((companions.items as Json[]) ?? []).entries()) {
    partnerIds[i] = await upsert(payload, 'partners', { and: [{ title: { equals: p.title } }, { order: { equals: i } }] }, {
      title: p.title,
      logo: await img(p.img),
      type: p.description ? await term('partnerType', String(p.description)) : null,
      items: ((p.items as string[]) ?? []).map((value) => ({ value })),
      order: i,
    })
  }
  log('Партнёры загружены')

  // ——— тексты разделов (RU и EN) ———
  for (const locale of ['ru', 'en'] as Locale[]) {
    const pre = locale === 'en' ? 'en/' : ''
    const read = async (f: string) => ((await readJson(`${pre}${f}`)) ?? (await readJson(f)))?.data as Json
    const meta = (d: Json) => {
      const items = ((d.breadcrumbs as Json)?.items as Json[]) ?? []
      const parent = items.length > 1 ? items[0] : undefined
      return {
        seoTitle: (d.seo as Json)?.title ?? null,
        crumb: items[items.length - 1]?.title ?? null,
        crumbParentTitle: parent?.title ?? null,
        crumbParentUrl: parent?.url ?? null,
        crumbVariant: (d.breadcrumbs as Json)?.variant === 'breadcrumbs_blue' ? 'breadcrumbs_blue' : 'default',
      }
    }
    const put = async (slug: string, shape: Shape, value: Json) => {
      const data = (await fromFront(shape, value, ctx)) as Json
      await payload.updateGlobal({ slug: slug as never, locale, data: { ...data, meta: meta(value) } as never })
    }
    const e = await read('expertise.json')
    await put('expertise-page', expertisePageShape, e)
    const s = await read('services.json')
    await put('catalog-page', catalogPageShape, s)
    const v = await read('vacancies.json')
    const inn = await read('internships.json')
    const j = (await read('jobs.json')) ?? jobs
    await put('career-page', careerPageShape, { ...v, vacancies: v.jobs, internships: inn.jobs, callback: j?.callback })
    const pt = await read('about/partners.json')
    await put('partners-page', partnersPageShape, pt)

    if (locale === 'en') {
      // английские названия справочников — по коду
      const en = await read('expertise.json')
      for (const d of itemsOf((en.expertiseElector as Json).form as Json, 'industry')) {
        const found = await payload.find({ collection: 'industries', where: { code: { equals: d.value.toLowerCase() } }, limit: 1, depth: 0 })
        if (found.docs[0]) await payload.update({ collection: 'industries', id: found.docs[0].id, locale: 'en', data: { title: clean(d.title) } })
      }
      for (const d of itemsOf(((await read('services.json')).catalog as Json).form as Json, 'direction')) {
        const found = await payload.find({ collection: 'directions', where: { code: { equals: d.value.toLowerCase() } }, limit: 1, depth: 0 })
        if (found.docs[0]) await payload.update({ collection: 'directions', id: found.docs[0].id, locale: 'en', data: { title: clean(d.title) } })
      }
    }
  }
  log('Тексты разделов загружены')

  // ——— английские версии записей: по тем же позициям, что и в русских тестовых данных ———
  const en = async (f: string) => (await readJson(`en/${f}`))?.data as Json | undefined
  const setEn = async (collection: string, id: Id | undefined, data: Json) => {
    if (id === undefined) return
    await payload.update({ collection: collection as never, id, locale: 'en', data: data as never })
  }
  const enExpertise = await en('expertise.json')
  const enDetail = await en('expertise/news-1.json')
  for (const [i, card] of (((enExpertise?.expertiseElector as Json)?.items as Json[]) ?? []).entries()) {
    const target = cardIds[i]
    if (!target) continue
    if (target.collection === 'projects') {
      await setEn('projects', target.id, { title: card.title, supTag: card.supTag ?? null, tag: card.tag ?? null, secondTitle: card.secondTitle ?? null, description: card.description ?? null, stats: card.stats ?? [] })
    } else {
      const data: Json = { title: card.title, description: card.description ?? null }
      if (i === 0 && enDetail) {
        const d = enDetail.newsDetail as Json
        data.title = d.title
        Object.assign(data, (await fromFront(bodyShape, { items: d.items }, ctx)) as Json)
      }
      await setEn('publications', target.id, data)
    }
  }
  const enCatalog = (await en('services.json'))?.catalog as Json | undefined
  for (const [gi, group] of ((enCatalog?.items as Json[]) ?? []).entries()) {
    for (const [si, sub] of ((group.items as Json[]) ?? []).entries()) {
      const cell = serviceGrid[gi]?.[si]
      if (!cell) continue
      if (cell.sub && sub.title) await setEn('subdirections', cell.sub, { title: sub.title })
      for (const [ci, c] of ((sub.cardItems as Json[]) ?? []).entries()) await setEn('services', cell.cards[ci], { title: c.title, description: c.description ?? null })
    }
  }
  for (const [kind, file, detailFile] of [['vacancy', 'vacancies.json', 'vacancies/vacancy-1.json'], ['internship', 'internships.json', 'internships/internship-1.json']] as const) {
    const list = (((await en(file))?.jobs as Json)?.items as Json[]) ?? []
    const ruList = ((((await readJson(file))?.data as Json)?.jobs as Json)?.items as Json[]) ?? []
    const full = await en(detailFile)
    for (const [i, card] of list.entries()) {
      const id = jobIds[kind][i]
      if (id === undefined) continue
      const data: Json = { title: card.title }
      if (i === 0 && full) {
        data.title = (full.hero as Json).title
        Object.assign(data, (await fromFront(vacancySectionsShape, full, ctx)) as Json)
      }
      await setEn('vacancies', id, data)
      // названия городов, опыта, формата и тегов — по тем же позициям
      const ru = ruList[i]
      const pairs: [string, unknown, unknown][] = [
        ['vacancyTag', ru?.tag, card.tag],
        ...(['city', 'experience', 'workFormat'] as const).map((k, n) => [k, (ru?.items as string[])?.[n], (card.items as string[])?.[n]] as [string, unknown, unknown]),
      ]
      for (const [k, ruTitle, enTitle] of pairs) {
        const tid = ruTitle ? termIds.get(`${k}:${clean(String(ruTitle))}`) : undefined
        if (tid !== undefined && enTitle && !termEn.has(tid)) termEn.set(tid, clean(String(enTitle)))
      }
    }
  }
  const enPartners = ((await en('about/partners.json'))?.companions as Json)?.items as Json[] | undefined
  for (const [i, p] of (enPartners ?? []).entries()) {
    await setEn('partners', partnerIds[i], { title: p.title, items: ((p.items as string[]) ?? []).map((value) => ({ value })) })
    const ruType = ((companions.items as Json[])[i]?.description as string) ?? ''
    const tid = termIds.get(`partnerType:${clean(ruType)}`)
    if (tid !== undefined && p.description && !termEn.has(tid)) termEn.set(tid, clean(String(p.description)))
  }
  for (const [id, title] of termEn) await setEn('terms', id, { title })
  log('Английские версии загружены')
}
