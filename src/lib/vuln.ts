/**
 * API раздела «Уязвимости» для сайта: список (поиск, страницы) и карточка уязвимости.
 * GET /api/vuln/?q=&page=  и  GET /api/vuln/<код>/
 */
import type { Payload, Where } from 'payload'

import { severityOf } from '../collections/Vulnerabilities'

type Locale = 'ru' | 'en'
type Doc = Record<string, unknown>

const PAGE = 20

const T = {
  ru: { title: 'Уязвимости', lead: 'Уязвимости, найденные специалистами «Инфосистемы Джет» и опубликованные после исправления вендором', crumb: 'Уязвимости' },
  en: { title: 'Vulnerabilities', lead: 'Vulnerabilities discovered by Jet Infosystems experts and published after the vendor fix', crumb: 'Vulnerabilities' },
}

const card = (d: Doc) => ({
  slug: d.slug,
  title: d.title,
  cve: d.cve,
  date: d.date,
  vendor: d.vendor ?? undefined,
  score: d.cvss3 ?? undefined,
  severity: severityOf(d.cvss3 as number | null),
  state: d.state ?? 'active',
})

export const vulnList = async (payload: Payload, locale: Locale, query: URLSearchParams) => {
  const q = (query.get('q') ?? '').trim().slice(0, 100)
  const page = Math.max(1, Number(query.get('page')) || 1)
  const and: Where[] = [{ _status: { equals: 'published' } }]
  if (q) and.push({ or: [{ title: { like: q } }, { cve: { like: q } }, { vendor: { like: q } }] })
  const res = await payload.find({ collection: 'vulnerabilities', where: { and }, locale, sort: '-date', page, limit: PAGE, depth: 0, overrideAccess: true })
  const docs = (res.docs as unknown as Doc[]).filter((d) => d.title)
  return {
    status: 'success',
    data: {
      seo: { title: T[locale].title },
      breadcrumbs: { items: [{ title: T[locale].crumb }] },
      title: T[locale].title,
      description: T[locale].lead,
      query: q,
      page: res.page ?? 1,
      pages: res.totalPages,
      total: res.totalDocs,
      items: docs.map(card),
    },
  }
}

export const vulnPage = async (payload: Payload, locale: Locale, slug: string) => {
  const res = await payload.find({
    collection: 'vulnerabilities',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    locale,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const d = res.docs[0] as unknown as Doc | undefined
  if (!d?.title) return null
  const seo = (d.seo ?? {}) as { title?: string; description?: string }
  const links = (d.links ?? {}) as Record<string, string | null>
  return {
    status: 'success',
    data: {
      seo: { title: seo.title || `${d.title} (${d.cve})`, ...(seo.description ? { description: seo.description } : {}) },
      breadcrumbs: { items: [{ title: T[locale].crumb, url: '/vuln/' }, { title: String(d.cve) }] },
      ...card(d),
      product: d.product ?? undefined,
      vector3: d.vector3 ?? undefined,
      cvss2: d.cvss2 ?? undefined,
      vector2: d.vector2 ?? undefined,
      description: d.description,
      fix: d.fix ?? undefined,
      workaround: d.workaround ?? undefined,
      foundBy: d.foundBy ?? undefined,
      links: Object.fromEntries(Object.entries(links).filter(([k, v]) => k !== 'id' && typeof v === 'string' && v)),
    },
  }
}
