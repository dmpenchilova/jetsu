/**
 * Справочники компании: сотрудники, клиенты, награды. Из них блоки «Команда», «Лидер направления»,
 * «Остались вопросы (эксперт)», «Награды» и логотипы в «О компании» берут данные — фото и должность
 * меняются в одном месте.
 */
import type { CollectionConfig } from 'payload'

import { dictAccess, imageGroup, revalidateHooks } from './shared'

export const People: CollectionConfig = {
  slug: 'people',
  labels: { singular: 'Сотрудник', plural: 'Сотрудники' },
  admin: {
    useAsTitle: 'name',
    group: 'Компания',
    defaultColumns: ['name', 'position', 'department', 'updatedAt'],
    listSearchableFields: ['name', 'position', 'email'],
    description: 'Эксперты и руководители для блоков «Команда», «Лидер направления», «Остались вопросы»',
  },
  defaultSort: 'order',
  access: dictAccess,
  hooks: revalidateHooks([]),
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Имя и фамилия', type: 'text', required: true, localized: true, admin: { width: '50%' } },
        { name: 'position', label: 'Должность', type: 'text', localized: true, admin: { width: '50%' } },
      ],
    },
    imageGroup('photo', 'Фото'),
    {
      type: 'row',
      fields: [
        { name: 'department', label: 'Подразделение', type: 'text', localized: true, admin: { width: '40%' } },
        { name: 'email', label: 'E-mail', type: 'email', admin: { width: '30%' } },
        { name: 'phone', label: 'Телефон', type: 'text', admin: { width: '30%' } },
      ],
    },
    { name: 'order', label: 'Порядок', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
}

export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: { singular: 'Клиент', plural: 'Клиенты' },
  admin: {
    useAsTitle: 'title',
    group: 'Компания',
    defaultColumns: ['title', 'updatedAt'],
    description: 'Логотипы клиентов: светлый — для белого фона, тёмный — для синего',
  },
  defaultSort: 'order',
  access: dictAccess,
  hooks: revalidateHooks([]),
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, localized: true },
    {
      type: 'row',
      fields: [
        { name: 'logoLight', label: 'Логотип для светлого фона', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
        { name: 'logoDark', label: 'Логотип для тёмного фона', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
      ],
    },
    { name: 'url', label: 'Сайт', type: 'text' },
    { name: 'order', label: 'Порядок', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
}

export const Awards: CollectionConfig = {
  slug: 'awards',
  labels: { singular: 'Награда', plural: 'Награды' },
  admin: {
    useAsTitle: 'title',
    group: 'Компания',
    defaultColumns: ['title', 'year', 'updatedAt'],
    description: 'Для блока «Награды»: в автоматическом режиме — свежие сверху',
  },
  defaultSort: '-year',
  access: dictAccess,
  hooks: revalidateHooks([]),
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, localized: true },
    { name: 'description', label: 'За что', type: 'textarea', localized: true },
    {
      type: 'row',
      fields: [
        { name: 'year', label: 'Год', type: 'number', admin: { width: '30%' } },
        { name: 'url', label: 'Ссылка', type: 'text', admin: { width: '70%' } },
      ],
    },
    imageGroup('img', 'Картинка'),
  ],
}
