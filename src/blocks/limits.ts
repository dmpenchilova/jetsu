/**
 * Ограничения из макетов: сколько символов помещается в поле и сколько карточек в блоке.
 * Путь поля — через точку, «*» — любая строка списка: 'items.*.title'.
 * Используются счётчиком символов под полями и проверкой перед публикацией.
 */

export type BlockLimits = {
  chars?: Record<string, number>
  rows?: Record<string, [min: number, max: number]>
}

/** Для всех блоков, если у блока не задано своё. */
export const DEFAULT_CHARS: Record<string, number> = {
  tag: 40,
  supTag: 40,
  suptitle: 40,
  navTitle: 30,
  title: 150,
  subtitle: 250,
  subTitle: 250,
  'btn.title': 30,
  'link.title': 40,
}

export const BLOCK_LIMITS: Record<string, BlockLimits> = {
  viewIndustry: { chars: { description: 400 }, rows: { 'addContent.company': [0, 4] } },
  intro: { chars: { title: 150, description: 250 } },
  projectHero: { chars: { title: 140 } },
  ideas: { chars: { title: 200, description: 300 }, rows: { items: [0, 4] } },
  directions: { chars: { 'items.*.description': 500 }, rows: { 'items.*.company': [0, 4] } },
  examples: { chars: { 'items.*.title': 80, 'items.*.description': 500 }, rows: { 'items.*.stats': [1, 3] } },
  description: { chars: { description: 1200 } },
  valuation: { chars: { 'items.*.suptitle': 30, 'items.*.title': 60, 'items.*.description': 150 }, rows: { items: [0, 5] } },
  expertise: { chars: { 'items.*.title': 19 } },
  steps: { chars: { 'items.*.title': 50 } },
  results: { chars: { 'items.*.title': 6 }, rows: { items: [2, 6] } },
  realization: { chars: { text: 5000 } },
  plans: { chars: { text: 500 } },
  journal: { chars: { title: 150, description: 500 } },
  cases: { rows: { items: [0, 3] } },
  benefits: { rows: { items: [4, 10] } },
  advantages: { rows: { items: [0, 10] } },
  outcomes: { rows: { items: [4, 8] } },
  offers: { rows: { items: [0, 4] } },
  about: { rows: { items: [0, 5] } },
  stack: { rows: { items: [0, 20] } },
  aboutIndustry: { rows: { items: [0, 8] } },
  gallery: { rows: { items: [3, 100], socials: [0, 4] } },
  topical: { rows: { items: [2, 100] } },
  reviews: { rows: { items: [3, 100] } },
  careerHero: { rows: { tags: [4, 10] } },
}

/** Путь поля внутри блока без номеров строк: items.3.title → items.*.title */
export const patternOf = (path: string) => path.replace(/\.\d+(?=\.|$)/g, '.*')

/** Лимит символов для поля блока (по полному пути или по имени поля). */
export const charLimit = (blockType: string, innerPath: string): number | undefined => {
  const pattern = patternOf(innerPath)
  const own = BLOCK_LIMITS[blockType]?.chars ?? {}
  if (own[pattern] !== undefined) return own[pattern]
  const key = pattern.split('.').slice(-1)[0]
  const tail2 = pattern.split('.').slice(-2).join('.')
  // своё ограничение по имени поля применяется только к полям блока верхнего уровня
  if (!pattern.includes('.') && own[key] !== undefined) return own[key]
  return DEFAULT_CHARS[tail2] ?? (pattern.includes('.') ? undefined : DEFAULT_CHARS[key])
}

/** Длина текста, как её видит посетитель: без HTML-тегов. */
export const visibleLength = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, ' ').length
