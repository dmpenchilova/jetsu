import Link from 'next/link'
import type { Payload } from 'payload'

/** Главный экран админки по макету: приветствие, быстрые действия, неопубликованные правки, сводка. */

type Props = { payload: Payload; user?: { name?: string; email?: string } | null }

const SECTIONS = [
  { slug: 'pages', label: 'Страница' },
  { slug: 'publications', label: 'Публикация' },
  { slug: 'projects', label: 'Проект' },
  { slug: 'vacancies', label: 'Вакансия' },
] as const

const ICON = {
  page: 'M7 3h7l5 5v13H7z M14 3v5h5 M10 14h6 M13 11v6',
  pub: 'M4 5h16v14H4z M8 9h8 M8 13h8 M8 17h5',
  job: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M18 8v6 M15 11h6',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 16v4h16v-4',
}

const Svg = ({ d, color }: { d: string; color: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

const when = (iso: string) => {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 60000
  if (diff < 1) return 'только что'
  if (diff < 60) return `${Math.round(diff)} мин назад`
  if (diff < 24 * 60) return `${Math.round(diff / 60)} ч назад`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

const greeting = () => {
  const h = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Europe/Moscow' }))
  if (h < 6) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

const strip = (s: unknown) => (typeof s === 'string' ? s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '')

export const Dashboard = async ({ payload, user }: Props) => {
  // черновики: последние версии, которые ещё не опубликованы
  const drafts: { title: string; section: string; href: string; updatedAt: string; neverPublished: boolean }[] = []
  for (const s of SECTIONS) {
    const res = await payload
      .findVersions({ collection: s.slug, where: { and: [{ latest: { equals: true } }, { 'version._status': { equals: 'draft' } }] }, sort: '-updatedAt', limit: 8, depth: 0 })
      .catch(() => null)
    const parents = (res?.docs ?? []).map((v) => v.parent as number | string)
    const published = parents.length
      ? await payload.find({ collection: s.slug, where: { and: [{ id: { in: parents } }, { _status: { equals: 'published' } }] }, draft: false, depth: 0, limit: parents.length, select: {} })
      : { docs: [] }
    const publishedIds = new Set(published.docs.map((d) => String(d.id)))
    for (const v of res?.docs ?? []) {
      const version = v.version as { title?: string }
      drafts.push({
        title: strip(version.title) || 'Без названия',
        section: s.label,
        href: `/admin/collections/${s.slug}/${v.parent}`,
        updatedAt: String(v.updatedAt),
        neverPublished: !publishedIds.has(String(v.parent)),
      })
    }
  }
  drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const count = async (collection: string, published = true) =>
    (await payload.count({ collection: collection as never, where: published ? { _status: { equals: 'published' } } : undefined }).catch(() => ({ totalDocs: 0 }))).totalDocs
  const [pages, pubs, vacancies, media] = await Promise.all([count('pages'), count('publications'), count('vacancies'), count('media', false)])

  const recent = (
    await payload.find({ collection: 'publications', where: { _status: { equals: 'published' } }, sort: '-date', limit: 5, depth: 0 }).catch(() => ({ docs: [] }))
  ).docs as { id: number; title?: string; date?: string }[]

  // новые заявки — с учётом прав (HR видит только отклики)
  const leads = (await payload
    .find({ collection: 'submissions', where: { status: { equals: 'new' } }, sort: '-createdAt', limit: 5, depth: 0, user: user as never, overrideAccess: false })
    .catch(() => null)) as { totalDocs: number; docs: { id: number; summary?: string; createdAt: string; deliveryState?: string }[] } | null

  const name = (user?.name || user?.email || '').split(' ')[0]

  return (
    <div className="jet-dash">
      <header className="jet-dash__head">
        <div className="jet-dash__hello">
          <h1>
            {greeting()}
            {name ? `, ${name}` : ''}
          </h1>
          <p>На сайте {pages} страниц, {pubs} публикаций и {vacancies} вакансий</p>
        </div>
        <Link className="jet-btn jet-btn--dark" href="/admin/collections/pages/create">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14 M5 12h14" />
          </svg>
          Создать страницу
        </Link>
      </header>

      <section className="jet-dash__quick" aria-label="Быстрые действия">
        <Link href="/admin/collections/pages/create" className="jet-quick jet-quick--blue">
          <Svg d={ICON.page} color="#CDF824" />
          <span>
            <b>Создать страницу</b>
            <small>Собрать из блоков конструктора</small>
          </span>
        </Link>
        <Link href="/admin/collections/publications/create" className="jet-quick">
          <Svg d={ICON.pub} color="#0032AD" />
          <span>
            <b>Новая публикация</b>
            <small>Новость, статья или журнал</small>
          </span>
        </Link>
        <Link href="/admin/collections/vacancies/create" className="jet-quick">
          <Svg d={ICON.job} color="#0032AD" />
          <span>
            <b>Новая вакансия</b>
            <small>Или стажировка</small>
          </span>
        </Link>
        <Link href="/admin/collections/media/create" className="jet-quick">
          <Svg d={ICON.upload} color="#0032AD" />
          <span>
            <b>Загрузить файлы</b>
            <small>Картинки, видео, документы · {media}</small>
          </span>
        </Link>
      </section>

      <div className="jet-dash__grid">
        <section className="jet-card" aria-labelledby="drafts-h">
          <div className="jet-card__head">
            <h2 id="drafts-h">Неопубликованные изменения</h2>
            <Link href="/admin/collections/pages">Все страницы</Link>
          </div>
          <div className="jet-table">
            <div className="jet-table__th">
              <span>Название</span>
              <span>Раздел</span>
              <span>Когда</span>
            </div>
            {drafts.length === 0 && <div className="jet-table__empty">Всё опубликовано</div>}
            {drafts.slice(0, 8).map((d) => (
              <Link key={d.href} href={d.href} className="jet-table__tr">
                <span className="jet-table__title">
                  <span className={`jet-dot ${d.neverPublished ? 'jet-dot--gray' : 'jet-dot--blue'}`} />
                  <span className="jet-ell">{d.title}</span>
                </span>
                <span className="jet-muted">{d.section}</span>
                <span className="jet-muted">{when(d.updatedAt)}</span>
              </Link>
            ))}
          </div>
          <div className="jet-legend">
            <span>
              <span className="jet-dot jet-dot--gray" />
              Черновик, ещё не публиковался
            </span>
            <span>
              <span className="jet-dot jet-dot--blue" />
              Опубликован, есть новые правки
            </span>
          </div>
        </section>

        <div className="jet-dash__side">
          {leads && (
            <section className="jet-card" aria-labelledby="leads-h">
              <div className="jet-card__head">
                <h2 id="leads-h">Новые заявки{leads.totalDocs ? ` · ${leads.totalDocs}` : ''}</h2>
                <Link href="/admin/collections/submissions">Все</Link>
              </div>
              {leads.docs.length === 0 && <div className="jet-table__empty">Новых заявок нет</div>}
              {leads.docs.map((l) => (
                <Link key={l.id} href={`/admin/collections/submissions/${l.id}`} className="jet-list__item">
                  <span className="jet-ell">
                    {l.deliveryState === 'failed' && <span className="jet-dot jet-dot--red" title="Письмо не ушло" />}
                    {l.summary}
                  </span>
                  <span className="jet-muted jet-small">{when(l.createdAt)}</span>
                </Link>
              ))}
            </section>
          )}
          <section className="jet-card" aria-labelledby="recent-h">
            <div className="jet-card__head">
              <h2 id="recent-h">Последние публикации</h2>
              <Link href="/admin/collections/publications">Все</Link>
            </div>
            {recent.map((p) => (
              <Link key={p.id} href={`/admin/collections/publications/${p.id}`} className="jet-list__item">
                <span className="jet-ell">{strip(p.title)}</span>
                <span className="jet-muted jet-small">{p.date ? new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''}</span>
              </Link>
            ))}
          </section>
          <section className="jet-card jet-card--note" aria-label="Подсказка">
            <b>Как опубликовать правку</b>
            <span>Черновик сохраняется сам. Нажмите «Опубликовать изменения» — сайт обновится сразу, без ожидания кэша.</span>
          </section>
        </div>
      </div>
    </div>
  )
}
