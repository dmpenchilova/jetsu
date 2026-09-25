/**
 * Мероприятия и офисы. Показываются в блоках страниц («Мероприятия», «Офисы», «Контакты»).
 */
import type { CollectionConfig } from 'payload'

import { revalidateBound } from '../lib/revalidateBound'
import { contentAccess, dictAccess, drafts, guardPublish, imageGroup, linkGroup } from './shared'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Мероприятие', plural: 'Мероприятия' },
  admin: {
    useAsTitle: 'title',
    group: 'Экспертиза',
    defaultColumns: ['title', 'startAt', 'type', '_status'],
    listSearchableFields: ['title'],
    description: 'Прошедшие мероприятия со страниц пропадают сами',
  },
  defaultSort: 'startAt',
  access: contentAccess('author'),
  versions: drafts,
  hooks: {
    beforeChange: [({ data, req }) => guardPublish({ data, req })],
    afterChange: [
      async ({ req }) => {
        await revalidateBound(req.payload, 'events')
      },
    ],
    afterDelete: [
      async ({ req }) => {
        await revalidateBound(req.payload, 'events')
      },
    ],
  },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, localized: true, maxLength: 150 },
    { name: 'description', label: 'Описание', type: 'textarea', localized: true, maxLength: 500 },
    {
      type: 'row',
      fields: [
        { name: 'type', label: 'Тип', type: 'text', localized: true, admin: { width: '34%', description: 'Конференция, вебинар…' } },
        {
          name: 'format',
          label: 'Формат',
          type: 'relationship',
          relationTo: 'terms',
          filterOptions: { kind: { equals: 'eventFormat' } },
          admin: { width: '33%' },
        },
        { name: 'timeText', label: 'Когда (текстом)', type: 'text', localized: true, admin: { width: '33%', description: 'Например «20–25 октября». Если пусто — из даты' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startAt',
          label: 'Начало',
          type: 'date',
          required: true,
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy, HH:mm' } },
        },
        {
          name: 'endAt',
          label: 'Окончание',
          type: 'date',
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy, HH:mm' }, description: 'После окончания мероприятие скрывается' },
        },
      ],
    },
    { name: 'directions', label: 'Направления', type: 'relationship', relationTo: 'directions', hasMany: true },
    { name: 'industries', label: 'Отрасли', type: 'relationship', relationTo: 'industries', hasMany: true },
    imageGroup('img', 'Картинка'),
    linkGroup('btn', 'Кнопка', 'Зарегистрироваться'),
  ],
}

export const REGIONS = [
  { label: 'Россия', value: 'russia' },
  { label: 'СНГ', value: 'cis' },
] as const

export const Offices: CollectionConfig = {
  slug: 'offices',
  labels: { singular: 'Офис', plural: 'Офисы' },
  admin: { useAsTitle: 'title', group: 'Компания', defaultColumns: ['title', 'region', 'order'] },
  defaultSort: 'order',
  access: dictAccess,
  hooks: {
    afterChange: [
      async ({ req }) => {
        await revalidateBound(req.payload, 'offices')
      },
    ],
    afterDelete: [
      async ({ req }) => {
        await revalidateBound(req.payload, 'offices')
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'region', label: 'Регион', type: 'select', required: true, defaultValue: 'russia', options: [...REGIONS], admin: { width: '30%' } },
        { name: 'title', label: 'Город', type: 'text', required: true, localized: true, admin: { width: '70%' } },
      ],
    },
    { name: 'description', label: 'Адрес', type: 'textarea', localized: true },
    {
      name: 'groups',
      label: 'Контакты',
      type: 'array',
      localized: true,
      labels: { singular: 'группа', plural: 'Контакты' },
      admin: { description: 'Телефон, сервисный центр, почта…' },
      fields: [
        { name: 'title', label: 'Название группы', type: 'text', required: true },
        {
          name: 'items',
          label: 'Значения',
          type: 'array',
          labels: { singular: 'значение', plural: 'Значения' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'value', label: 'Текст', type: 'text', required: true, admin: { width: '50%' } },
                { name: 'link', label: 'Ссылка', type: 'text', admin: { width: '50%', description: 'tel:… или mailto:…' } },
              ],
            },
          ],
        },
      ],
    },
    { name: 'order', label: 'Порядок', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
}
