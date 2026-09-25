import type { CollectionConfig } from 'payload'

import { revalidateFront } from '../lib/revalidate'
import { dictAccess } from './shared'

/** Виды справочников. Направления и отрасли — отдельные коллекции, их записи тоже служат тегами. */
export const TERM_KINDS = [
  { label: 'Универсальные теги публикаций', value: 'universal' },
  { label: 'Теги вакансий', value: 'vacancyTag' },
  { label: 'Города', value: 'city' },
  { label: 'Опыт работы', value: 'experience' },
  { label: 'Формат работы', value: 'workFormat' },
  { label: 'Форматы мероприятий', value: 'eventFormat' },
  { label: 'Центры (отделы)', value: 'center' },
  { label: 'Типы партнёрства', value: 'partnerType' },
] as const

export type TermKind = (typeof TERM_KINDS)[number]['value']

export const Terms: CollectionConfig = {
  slug: 'terms',
  labels: { singular: 'Значение справочника', plural: 'Справочники и теги' },
  admin: {
    useAsTitle: 'title',
    group: 'Справочники',
    defaultColumns: ['title', 'kind', 'code', 'order'],
    listSearchableFields: ['title', 'code'],
    description: 'Теги, города, опыт, форматы и другие списки для фильтров сайта',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: 'order',
  access: dictAccess,
  hooks: {
    afterChange: [
      async ({ req }) => {
        // значения справочников показываются в фильтрах и карточках всех списков
        await revalidateFront(req.payload, ['expertise', 'detail', 'services', 'vacancies', 'internships', 'job-detail', 'companions'])
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'kind', label: 'Справочник', type: 'select', required: true, index: true, options: [...TERM_KINDS], admin: { width: '40%' } },
        { name: 'title', label: 'Значение', type: 'text', required: true, localized: true, admin: { width: '60%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'code',
          label: 'Код для адреса фильтра',
          type: 'text',
          required: true,
          index: true,
          admin: { width: '40%', description: 'Латиница, например moscow' },
          validate: (v: string | null | undefined) => !v || /^[a-z0-9_-]+$/.test(v) || 'Латиница, цифры, дефис',
        },
        { name: 'order', label: 'Порядок', type: 'number', defaultValue: 100, admin: { width: '20%' } },
        { name: 'email', label: 'Ящик для заявок', type: 'email', admin: { width: '40%', condition: (d) => d?.kind === 'center', description: 'Для центров: куда уходят письма из форм' } },
      ],
    },
  ],
}
