/** Меню админки — как в макете: группы, иконки, порядок. */
export type NavItem = {
  label: string
  href: string
  /** коллекция или глобальный раздел — чтобы спрятать пункт, если нет доступа */
  entity?: { type: 'collection' | 'global'; slug: string }
  icon: string
  group?: string
}

const c = (slug: string) => ({ type: 'collection' as const, slug })
const g = (slug: string) => ({ type: 'global' as const, slug })

export const NAV_ITEMS: NavItem[] = [
  { label: 'Главная', href: '/admin', icon: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  { label: 'Страницы', href: '/admin/collections/pages', entity: c('pages'), icon: 'M7 3h7l5 5v13H7z M14 3v5h5' },

  { group: 'Экспертиза', label: 'Публикации', href: '/admin/collections/publications', entity: c('publications'), icon: 'M4 5h16v14H4z M8 9h8 M8 13h8 M8 17h5' },
  { label: 'Проекты', href: '/admin/collections/projects', entity: c('projects'), icon: 'M4 8h16v11H4z M9 8V5h6v3' },

  { group: 'Контент', label: 'Услуги и решения', href: '/admin/collections/services', entity: c('services'), icon: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z' },
  { label: 'Карьера', href: '/admin/collections/vacancies', entity: c('vacancies'), icon: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M17 11a3 3 0 1 0 0-6 M21 20c0-2.6-1.7-4.9-4-5.7' },
  { label: 'Партнёры', href: '/admin/collections/partners', entity: c('partners'), icon: 'M5 21V4h10v17 M15 9h4v12 M8 8h4 M8 12h4 M8 16h4 M3 21h18' },

  { group: 'Справочники', label: 'Теги и списки', href: '/admin/collections/terms', entity: c('terms'), icon: 'M3 12V4h8l10 10-8 8z M7.5 7.5h.01' },
  { label: 'Направления', href: '/admin/collections/directions', entity: c('directions'), icon: 'M4 12h16 M14 6l6 6-6 6' },
  { label: 'Поднаправления', href: '/admin/collections/subdirections', entity: c('subdirections'), icon: 'M6 4v10a4 4 0 0 0 4 4h8 M14 14l4 4-4 4' },
  { label: 'Отрасли', href: '/admin/collections/industries', entity: c('industries'), icon: 'M3 21h18 M5 21V10l5 3V10l5 3V6l4 2v13' },

  { group: 'Сервис', label: 'Формы', href: '/admin/collections/forms', entity: c('forms'), icon: 'M5 3h14v18H5z M9 8h6 M9 12h6 M9 16h3' },
  { label: 'Медиатека', href: '/admin/collections/media', entity: c('media'), icon: 'M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4 M15 9h.01' },
  { label: 'Пользователи', href: '/admin/collections/users', entity: c('users'), icon: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z' },

  { group: 'Настройки сайта', label: 'Хедер', href: '/admin/globals/header', entity: g('header'), icon: 'M4 5h16v4H4z M4 13h10 M4 17h7' },
  { label: 'Футер', href: '/admin/globals/footer', entity: g('footer'), icon: 'M4 15h16v4H4z M4 7h10 M4 11h7' },
  { label: 'Страница 404', href: '/admin/globals/not-found', entity: g('not-found'), icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 8v5 M12 16h.01' },
  { label: 'Попап «Связаться»', href: '/admin/globals/popup-callback', entity: g('popup-callback'), icon: 'M4 5h16v11H8l-4 4z' },

  { group: 'Разделы сайта', label: 'Центр экспертизы', href: '/admin/globals/expertise-page', entity: g('expertise-page'), icon: 'M12 3l2.5 6 6.5.5-5 4 1.5 6.5-5.5-3.5-5.5 3.5L9 13.5l-5-4L10.5 9z' },
  { label: 'Каталог услуг', href: '/admin/globals/catalog-page', entity: g('catalog-page'), icon: 'M5 4h14v16H5z M9 8h6 M9 12h6' },
  { label: 'Вакансии: списки', href: '/admin/globals/career-page', entity: g('career-page'), icon: 'M4 8h16v11H4z M9 8V5h6v3 M4 13h16' },
  { label: 'Страница партнёров', href: '/admin/globals/partners-page', entity: g('partners-page'), icon: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M16 11a3 3 0 1 0 0-6 M2 20c0-3 2.7-5 6-5s6 2 6 5 M16 15c3 0 6 2 6 5' },
]
