/**
 * Поиск по сайту: служебный индекс (заполняется сам при публикации) и журнал запросов посетителей.
 */
import type { CollectionConfig } from 'payload'

import { hasRole } from '../access'

export const SEARCH_TYPES = [
  { label: 'Новости', value: 'news' },
  { label: 'Статьи', value: 'article' },
  { label: 'Журнал', value: 'journal' },
  { label: 'Услуги', value: 'service' },
  { label: 'О компании', value: 'company' },
  { label: 'Отрасли', value: 'industry' },
  { label: 'Проекты', value: 'project' },
  { label: 'Карьера', value: 'career' },
  { label: 'Другое', value: 'other' },
] as const

export type SearchType = (typeof SEARCH_TYPES)[number]['value']

export const SearchIndex: CollectionConfig = {
  slug: 'search-index',
  labels: { singular: 'Запись индекса', plural: 'Индекс поиска' },
  admin: { hidden: true, useAsTitle: 'title' },
  access: { read: hasRole('admin'), create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'source', type: 'text', index: true },
    { name: 'locale', type: 'text', index: true },
    { name: 'type', type: 'select', options: [...SEARCH_TYPES], index: true },
    { name: 'title', type: 'text' },
    { name: 'text', type: 'textarea' },
    { name: 'url', type: 'text' },
    { name: 'tags', type: 'json' },
    { name: 'date', type: 'date' },
  ],
}

export const SearchQueries: CollectionConfig = {
  slug: 'search-queries',
  labels: { singular: 'Поисковый запрос', plural: 'Поисковые запросы' },
  admin: {
    useAsTitle: 'query',
    group: 'Настройки сайта',
    defaultColumns: ['query', 'results', 'type', 'locale', 'createdAt'],
    description: 'Что ищут посетители сайта. Запросы без результатов подскажут, каких материалов не хватает. Хранятся 180 дней',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: '-createdAt',
  access: { read: hasRole('admin', 'editor'), create: () => false, update: () => false, delete: hasRole('admin') },
  fields: [
    { name: 'query', label: 'Запрос', type: 'text', index: true, admin: { readOnly: true } },
    { name: 'results', label: 'Найдено', type: 'number', index: true, admin: { readOnly: true } },
    { name: 'type', label: 'Раздел', type: 'text', admin: { readOnly: true } },
    { name: 'locale', label: 'Язык', type: 'text', admin: { readOnly: true } },
  ],
}
