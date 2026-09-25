/**
 * Каталог: направления, поднаправления, отрасли, услуги и решения.
 * Направления и отрасли одновременно служат тегами публикаций и фильтрами.
 */
import type { CollectionConfig, Field } from 'payload'

import { imageFields } from '../blocks/fields'
import { dictAccess, imageGroup, revalidateHooks, slugField } from './shared'

const LIST_TAGS = ['expertise', 'detail', 'services', 'companions']

const codeField: Field = {
  name: 'code',
  label: 'Код для адреса фильтра',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: { position: 'sidebar', description: 'Латиница, например it или security' },
  validate: (v: string | null | undefined) => !v || /^[a-z0-9_-]+$/.test(v) || 'Латиница, цифры, дефис',
}

const orderField: Field = { name: 'order', label: 'Порядок', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } }

const pageField: Field = {
  name: 'page',
  label: 'Страница на сайте',
  type: 'relationship',
  relationTo: 'pages',
  admin: { position: 'sidebar', description: 'Страница конструктора, на которую ведут ссылки' },
}

const logosField: Field = {
  name: 'logos',
  label: 'Логотипы клиентов',
  type: 'array',
  maxRows: 4,
  labels: { singular: 'логотип', plural: 'Логотипы клиентов' },
  admin: { initCollapsed: true },
  fields: imageFields(true, false),
}

export const Directions: CollectionConfig = {
  slug: 'directions',
  labels: { singular: 'Направление', plural: 'Направления' },
  admin: { useAsTitle: 'title', group: 'Услуги и решения', defaultColumns: ['title', 'code', 'center', 'order'] },
  defaultSort: 'order',
  access: dictAccess,
  hooks: revalidateHooks(LIST_TAGS),
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, localized: true },
    { name: 'center', label: 'Центр', type: 'relationship', relationTo: 'terms', filterOptions: { kind: { equals: 'center' } } },
    {
      type: 'collapsible',
      label: 'Карточка в слайдере направлений',
      admin: { initCollapsed: true },
      fields: [
        { name: 'cardTitle', label: 'Заголовок карточки', type: 'text', localized: true, admin: { description: 'Например «Развивайте бизнес. Мы обеспечим поддержку.» Если пусто — название направления' } },
        { name: 'description', label: 'Описание', type: 'textarea', localized: true, maxLength: 500, admin: { description: 'Абзацы разделяйте пустой строкой' } },
        imageGroup('image', 'Картинка'),
        logosField,
      ],
    },
    codeField,
    orderField,
    pageField,
  ],
}

export const Subdirections: CollectionConfig = {
  slug: 'subdirections',
  labels: { singular: 'Поднаправление', plural: 'Поднаправления' },
  admin: { useAsTitle: 'title', group: 'Услуги и решения', defaultColumns: ['title', 'direction', 'order'], description: 'Группы услуг внутри направления' },
  defaultSort: 'order',
  access: dictAccess,
  hooks: revalidateHooks(['services']),
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, localized: true, maxLength: 100 },
    { name: 'direction', label: 'Направление', type: 'relationship', relationTo: 'directions', required: true },
    { name: 'description', label: 'Описание', type: 'textarea', localized: true, maxLength: 250 },
    orderField,
  ],
}

export const Industries: CollectionConfig = {
  slug: 'industries',
  labels: { singular: 'Отрасль', plural: 'Отрасли' },
  admin: { useAsTitle: 'title', group: 'Услуги и решения', defaultColumns: ['title', 'code', 'order'] },
  defaultSort: 'order',
  access: dictAccess,
  hooks: revalidateHooks(LIST_TAGS),
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, localized: true },
    { name: 'short', label: 'Краткое описание', type: 'textarea', localized: true },
    { name: 'description', label: 'Полное описание (для попапа)', type: 'textarea', localized: true },
    {
      name: 'metrics',
      label: 'Цифры',
      type: 'array',
      localized: true,
      maxRows: 3,
      labels: { singular: 'цифра', plural: 'Цифры' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', label: 'Значение', type: 'text', required: true, admin: { width: '30%' } },
            { name: 'label', label: 'Подпись', type: 'text', admin: { width: '70%' } },
          ],
        },
      ],
    },
    logosField,
    codeField,
    orderField,
    pageField,
  ],
}

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Услуга', plural: 'Услуги и решения' },
  admin: {
    useAsTitle: 'title',
    group: 'Услуги и решения',
    defaultColumns: ['title', 'direction', 'subdirection', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
  },
  defaultSort: 'order',
  access: dictAccess,
  hooks: revalidateHooks(['services', 'detail']),
  fields: [
    {
      name: 'title',
      label: 'Название',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 150,
      admin: { description: 'Можно выделить часть: <span>слово</span>' },
    },
    { name: 'description', label: 'Краткое описание', type: 'textarea', localized: true, maxLength: 200 },
    {
      type: 'row',
      fields: [
        { name: 'direction', label: 'Направление', type: 'relationship', relationTo: 'directions', required: true, admin: { width: '50%' } },
        {
          name: 'subdirection',
          label: 'Поднаправление',
          type: 'relationship',
          relationTo: 'subdirections',
          admin: { width: '50%' },
          filterOptions: ({ data }) => (data?.direction ? { direction: { equals: data.direction } } : true),
        },
      ],
    },
    { name: 'industries', label: 'Отрасли', type: 'relationship', relationTo: 'industries', hasMany: true },
    slugField('title', { description: 'Страница услуги: /services/<код>/ — её собирают в конструкторе' }),
    orderField,
  ],
}
