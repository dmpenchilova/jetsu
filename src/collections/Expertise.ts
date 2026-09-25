/**
 * Центр экспертизы: публикации (новости, статьи, журнал) и проекты (кейсы).
 */
import type { CollectionConfig, Field } from 'payload'
import { APIError } from 'payload'

import { blockShapes } from '../blocks'
import { imageFields, objectFields } from '../blocks/fields'
import type { Prop, Shape } from '../blocks/shape'
import { contentAccess, drafts, guardPublish, imageGroup, linkGroup, revalidateHooks, seoFields, slugField } from './shared'

export const PUBLICATION_TYPES = [
  { label: 'Новость', value: 'news' },
  { label: 'Статья', value: 'article' },
  { label: 'Статья из журнала Jet Info', value: 'journal' },
] as const

/** Тело публикации — те же подблоки, что в блоке «Тело публикации»: текст, цитата, таблица, медиа. */
const newsItems = (blockShapes.newsDetail as Extract<Shape, { kind: 'object' }>).props.find((p) => p.key === 'items') as Prop
export const bodyShape: Shape = { kind: 'object', props: [{ ...newsItems, name: 'body' }] }

const tagFields: Field[] = [
  { name: 'directions', label: 'Направления', type: 'relationship', relationTo: 'directions', hasMany: true },
  { name: 'industries', label: 'Отрасли', type: 'relationship', relationTo: 'industries', hasMany: true },
]

const countTags = (data: Record<string, unknown>) =>
  ['directions', 'industries', 'universal'].reduce((n, k) => n + (Array.isArray(data[k]) ? (data[k] as unknown[]).length : 0), 0)

export const Publications: CollectionConfig = {
  slug: 'publications',
  labels: { singular: 'Публикация', plural: 'Публикации' },
  admin: {
    useAsTitle: 'title',
    group: 'Экспертиза',
    defaultColumns: ['title', 'type', 'date', 'recommended', '_status'],
    listSearchableFields: ['title', 'slug'],
  },
  defaultSort: '-date',
  access: contentAccess('author'),
  versions: drafts,
  hooks: {
    ...revalidateHooks(['expertise', 'detail']),
    beforeChange: [
      ({ data, req }) => {
        guardPublish({ data, req })
        if (countTags(data) > 3) throw new APIError('У публикации не больше трёх тегов вместе: направления, отрасли и универсальные', 400, undefined, true)
        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Содержимое',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'type', label: 'Тип', type: 'select', required: true, defaultValue: 'news', options: [...PUBLICATION_TYPES], admin: { width: '30%' } },
                { name: 'date', label: 'Дата', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { width: '30%', date: { displayFormat: 'd MMMM yyyy' } } },
              ],
            },
            { name: 'title', label: 'Заголовок', type: 'text', required: true, localized: true, maxLength: 200 },
            { name: 'description', label: 'Анонс для карточки', type: 'textarea', localized: true, maxLength: 300 },
            imageGroup('cover', 'Обложка карточки', { description: 'Если нет — карточка с синей маской' }),
            imageGroup('background', 'Фон шапки публикации', { background: true }),
            ...objectFields(bodyShape.kind === 'object' ? bodyShape.props : [], false).map((f) => ({ ...f, label: 'Тело публикации', localized: true }) as Field),
          ],
        },
        {
          label: 'Теги и связи',
          fields: [
            ...tagFields,
            { name: 'universal', label: 'Универсальные теги', type: 'relationship', relationTo: 'terms', hasMany: true, filterOptions: { kind: { equals: 'universal' } } },
            { name: 'relatedServices', label: 'Связанные услуги', type: 'relationship', relationTo: 'services', hasMany: true },
            {
              name: 'similar',
              label: 'Похожие публикации',
              type: 'relationship',
              relationTo: 'publications',
              hasMany: true,
              admin: { description: 'Если пусто — подбираются сами по общим тегам' },
            },
          ],
        },
        { label: 'SEO', fields: [seoFields] },
      ],
    },
    slugField('title', { description: 'Адрес: /expertise/<код>/' }),
    { name: 'recommended', label: 'Рекомендуемое', type: 'checkbox', admin: { position: 'sidebar' } },
    { name: 'priority', label: 'Приоритет', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Выше — раньше среди рекомендуемых' } },
  ],
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Проект', plural: 'Проекты и кейсы' },
  admin: {
    useAsTitle: 'title',
    group: 'Экспертиза',
    defaultColumns: ['title', 'date', 'recommended', '_status'],
    listSearchableFields: ['title'],
  },
  defaultSort: '-date',
  access: contentAccess('author'),
  versions: drafts,
  hooks: { ...revalidateHooks(['expertise']), beforeChange: [({ data, req }) => guardPublish({ data, req })] },
  fields: [
    { name: 'title', label: 'Заголовок', type: 'text', required: true, localized: true },
    {
      type: 'row',
      fields: [
        { name: 'supTag', label: 'Метка над карточкой', type: 'text', localized: true, admin: { width: '50%' } },
        { name: 'tag', label: 'Надзаголовок', type: 'text', localized: true, admin: { width: '50%', description: 'Если пусто — первое направление' } },
      ],
    },
    { name: 'secondTitle', label: 'Второй заголовок', type: 'text', localized: true },
    { name: 'description', label: 'Задача и решение', type: 'textarea', localized: true, maxLength: 500 },
    { name: 'company', label: 'Логотип клиента', type: 'group', fields: imageFields(false, false) },
    {
      name: 'stats',
      label: 'Цифры',
      type: 'array',
      localized: true,
      maxRows: 3,
      labels: { singular: 'цифра', plural: 'Цифры' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'title', label: 'Значение', type: 'text', required: true, admin: { width: '40%' } },
            { name: 'description', label: 'Подпись', type: 'text', required: true, admin: { width: '60%' } },
          ],
        },
      ],
    },
    linkGroup('btn', 'Кнопка', 'Подробнее о проекте'),
    ...tagFields,
    { name: 'date', label: 'Дата', type: 'date', defaultValue: () => new Date().toISOString(), admin: { position: 'sidebar' } },
    { name: 'recommended', label: 'Рекомендуемое', type: 'checkbox', admin: { position: 'sidebar' } },
    { name: 'priority', label: 'Приоритет', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'hideInGrid', label: 'Скрыть в сетке Центра экспертизы', type: 'checkbox', admin: { position: 'sidebar' } },
  ],
}
