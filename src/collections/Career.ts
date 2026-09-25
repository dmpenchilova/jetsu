/**
 * Карьера и компания: вакансии и стажировки, партнёры.
 */
import type { CollectionConfig, Field } from 'payload'

import { otherShapes } from '../blocks'
import { imageFields, objectFields } from '../blocks/fields'
import type { Prop, Shape } from '../blocks/shape'
import { contentAccess, dictAccess, drafts, guardPublish, imageGroup, revalidateHooks, seoFields, slugField } from './shared'

/** Разделы страницы вакансии — по схеме фронта (о центре, обязанности, «будет плюсом», FAQ, отзывы). */
const SECTION_KEYS = ['aboutDirection', 'aboutVacancy', 'bePlus', 'advantages', 'faq', 'reviews']
const SECTION_LABELS: Record<string, string> = {
  aboutDirection: 'О центре экспертизы',
  aboutVacancy: 'О вакансии: обязанности и требования',
  bePlus: 'Будет плюсом',
  advantages: 'Что мы предлагаем',
  faq: 'Вопросы и ответы',
  reviews: 'Цитаты сотрудников',
}
const jobDetail = otherShapes.jobDetailPage as Extract<Shape, { kind: 'object' }>
export const vacancySectionsShape: Shape = {
  kind: 'object',
  props: jobDetail.props.filter((p) => SECTION_KEYS.includes(p.key)).map((p) => ({ ...p, required: false }) as Prop),
}

const term = (name: string, label: string, kind: string, extra: Partial<Field> = {}): Field =>
  ({ name, label, type: 'relationship', relationTo: 'terms', filterOptions: { kind: { equals: kind } }, ...extra }) as Field

export const Vacancies: CollectionConfig = {
  slug: 'vacancies',
  labels: { singular: 'Вакансия', plural: 'Вакансии и стажировки' },
  admin: {
    useAsTitle: 'title',
    group: 'Карьера',
    defaultColumns: ['title', 'kind', 'tag', 'city', '_status'],
    listSearchableFields: ['title', 'slug'],
  },
  defaultSort: '-createdAt',
  access: contentAccess('hr'),
  versions: drafts,
  hooks: {
    ...revalidateHooks(['vacancies', 'internships', 'jobs', 'job-detail']),
    beforeChange: [({ data, req }) => guardPublish({ data, req })],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основное',
          fields: [
            {
              name: 'kind',
              label: 'Тип',
              type: 'select',
              required: true,
              defaultValue: 'vacancy',
              options: [
                { label: 'Вакансия', value: 'vacancy' },
                { label: 'Стажировка', value: 'internship' },
              ],
            },
            { name: 'title', label: 'Название', type: 'text', required: true, localized: true, admin: { description: 'Перенос строки: <br>' } },
            {
              type: 'row',
              fields: [
                term('tag', 'Направление (тег вакансий)', 'vacancyTag', { admin: { width: '50%' } }),
                term('city', 'Город', 'city', { admin: { width: '50%', description: 'Пусто — «Вся Россия»' } }),
              ],
            },
            {
              type: 'row',
              fields: [
                term('experience', 'Опыт', 'experience', { admin: { width: '50%' } }),
                term('workFormat', 'Формат работы', 'workFormat', { admin: { width: '50%' } }),
              ],
            },
            imageGroup('background', 'Фон шапки', { background: true }),
            { name: 'closeAt', label: 'Снять с сайта', type: 'date', admin: { description: 'После этой даты вакансия пропадёт сама' } },
          ],
        },
        {
          label: 'Разделы страницы',
          fields: objectFields(vacancySectionsShape.kind === 'object' ? vacancySectionsShape.props : [], false).map((f) =>
            'name' in f && SECTION_LABELS[f.name] ? ({ ...f, localized: true, label: SECTION_LABELS[f.name], admin: { ...(f.admin ?? {}), description: 'Пустой раздел на сайте не показывается' } } as Field) : f,
          ),
        },
        {
          label: 'Похожие',
          fields: [
            {
              name: 'similar',
              label: 'Похожие вакансии',
              type: 'relationship',
              relationTo: 'vacancies',
              hasMany: true,
              admin: { description: 'Если пусто — подбираются по направлению и городу' },
            },
          ],
        },
        { label: 'SEO', fields: [seoFields] },
      ],
    },
    slugField('title', { description: 'Адрес: /vacancies/<код>/ или /internships/<код>/' }),
  ],
}

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Партнёр', plural: 'Партнёры' },
  admin: { useAsTitle: 'title', group: 'Компания', defaultColumns: ['title', 'type', 'order'], listSearchableFields: ['title'] },
  defaultSort: 'order',
  access: dictAccess,
  hooks: revalidateHooks(['companions']),
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, localized: true },
    { name: 'logo', label: 'Логотип', type: 'group', fields: imageFields(false, false) },
    term('type', 'Тип партнёрства', 'partnerType'),
    { name: 'directions', label: 'Направления', type: 'relationship', relationTo: 'directions', hasMany: true },
    {
      name: 'items',
      label: 'Подпункты',
      type: 'array',
      localized: true,
      labels: { singular: 'пункт', plural: 'Подпункты' },
      admin: { description: 'Нумеруются на сайте сами' },
      fields: [{ name: 'value', label: 'Текст', type: 'textarea', required: true }],
    },
    { name: 'url', label: 'Сайт партнёра', type: 'text' },
    { name: 'order', label: 'Порядок', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
}
