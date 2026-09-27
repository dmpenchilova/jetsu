/**
 * Поиск по админке (Cmd+K): записи всех разделов, к которым у пользователя есть доступ.
 * GET /cms-api/admin-search?q=…
 */
import type { Endpoint, Where } from 'payload'

const SOURCES: { slug: string; section: string; fields: string[]; title: string }[] = [
  { slug: 'pages', section: 'Страница', fields: ['title', 'path'], title: 'title' },
  { slug: 'publications', section: 'Публикация', fields: ['title', 'slug'], title: 'title' },
  { slug: 'projects', section: 'Проект', fields: ['title'], title: 'title' },
  { slug: 'events', section: 'Мероприятие', fields: ['title'], title: 'title' },
  { slug: 'vacancies', section: 'Вакансия', fields: ['title', 'slug'], title: 'title' },
  { slug: 'services', section: 'Услуга', fields: ['title', 'slug'], title: 'title' },
  { slug: 'directions', section: 'Направление', fields: ['title', 'code'], title: 'title' },
  { slug: 'industries', section: 'Отрасль', fields: ['title', 'code'], title: 'title' },
  { slug: 'partners', section: 'Партнёр', fields: ['title'], title: 'title' },
  { slug: 'people', section: 'Сотрудник', fields: ['name'], title: 'name' },
  { slug: 'clients', section: 'Клиент', fields: ['title'], title: 'title' },
  { slug: 'awards', section: 'Награда', fields: ['title'], title: 'title' },
  { slug: 'polls', section: 'Опрос', fields: ['question'], title: 'question' },
  { slug: 'vulnerabilities', section: 'Уязвимость', fields: ['title', 'cve', 'vendor'], title: 'title' },
  { slug: 'offices', section: 'Офис', fields: ['title'], title: 'title' },
  { slug: 'terms', section: 'Справочник', fields: ['title', 'code'], title: 'title' },
  { slug: 'shared-blocks', section: 'Общий блок', fields: ['title'], title: 'title' },
  { slug: 'page-templates', section: 'Шаблон', fields: ['title'], title: 'title' },
  { slug: 'forms', section: 'Форма', fields: ['title'], title: 'title' },
  { slug: 'media', section: 'Файл', fields: ['filename', 'alt'], title: 'filename' },
  { slug: 'submissions', section: 'Заявка', fields: ['summary', 'search'], title: 'summary' },
  { slug: 'users', section: 'Пользователь', fields: ['email', 'name'], title: 'email' },
  { slug: 'redirects', section: 'Редирект', fields: ['from', 'to'], title: 'from' },
]

const strip = (v: unknown) => (typeof v === 'string' ? v.replace(/<[^>]+>/g, '').trim() : '')

export const adminSearchEndpoint: Endpoint = {
  path: '/admin-search',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ hits: [] }, { status: 401 })
    const q = (new URL(req.url ?? '', 'http://x').searchParams.get('q') ?? '').trim().slice(0, 100)
    if (q.length < 2) return Response.json({ hits: [] })
    const results = await Promise.all(
      SOURCES.map(async (s) => {
        const where: Where = { or: s.fields.map((f) => ({ [f]: { like: q } })) }
        const res = await req.payload
          .find({ collection: s.slug as 'pages', where, limit: 5, depth: 0, locale: 'ru', draft: true, overrideAccess: false, user: req.user })
          .catch(() => ({ docs: [] }))
        return (res.docs as unknown as Record<string, unknown>[]).map((d) => ({
          title: strip(d[s.title]) || `№ ${d.id}`,
          section: s.section,
          href: `/admin/collections/${s.slug}/${d.id}`,
        }))
      }),
    )
    return Response.json({ hits: results.flat().slice(0, 30) })
  },
}
