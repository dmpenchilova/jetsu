/**
 * Блоки, которые умеют брать данные из коллекций. У такого блока появляется выбор источника:
 * вручную (как раньше), автоматически из коллекции или выбранные записи.
 */
export type Binding = {
  /** какое поле блока заполняется из коллекции */
  prop: string
  collection: string
  /** что значит «автоматически»; если нет — доступен только выбор записей */
  auto?: string
  limit?: number
}

export const BINDINGS: Record<string, Binding> = {
  events: { prop: 'items', collection: 'events', auto: 'ближайшие мероприятия по дате', limit: 6 },
  topical: { prop: 'items', collection: 'publications', auto: 'сначала рекомендуемые, затем свежие публикации', limit: 6 },
  similarNews: { prop: 'items', collection: 'publications', auto: 'свежие публикации', limit: 6 },
  directions: { prop: 'items', collection: 'directions', auto: 'все направления по порядку' },
  industries: { prop: 'items', collection: 'industries', auto: 'все отрасли по порядку' },
  partners: { prop: 'items', collection: 'partners', auto: 'все партнёры по порядку' },
  vendors: { prop: 'items', collection: 'partners', auto: 'все партнёры по порядку' },
  offices: { prop: 'offices', collection: 'offices', auto: 'все офисы из раздела «Офисы»' },
  contacts: { prop: 'offices', collection: 'offices', auto: 'все офисы из раздела «Офисы»' },
  relatedServices: { prop: 'items', collection: 'services' },
}

export type Source = 'manual' | 'auto' | 'pick'

export const sourceOf = (row: Record<string, unknown>): Source => {
  const s = row.source
  return s === 'auto' || s === 'pick' ? s : 'manual'
}
