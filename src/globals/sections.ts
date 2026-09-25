/**
 * Тексты и фоны разделов, которые собираются из коллекций: Центр экспертизы, каталог, карьера, партнёры.
 * Поля строятся из схем страниц фронта; сами списки и фильтры админка собирает из коллекций.
 */
import type { Field, GlobalConfig } from 'payload'

import { otherShapes } from '../blocks'
import type { Prop, Shape } from '../blocks/shape'
import { propsOf, shapeGlobal } from './factory'

/** Берёт из схемы страницы только нужные поля (списки, фильтры и счётчики собираются сами). */
const pick = (shape: Shape, keys: Record<string, string[] | true>): Shape => ({
  kind: 'object',
  props: propsOf(shape)
    .filter((p) => keys[p.key])
    .map((p): Prop => {
      const sub = keys[p.key]
      if (sub === true || p.shape.kind !== 'object') return { ...p, required: false }
      return { ...p, required: false, shape: { kind: 'object', props: p.shape.props.filter((c) => sub.includes(c.key)) } }
    }),
})

const metaFields: Field[] = [
  {
    name: 'meta',
    label: 'SEO и хлебные крошки',
    type: 'group',
    localized: true,
    fields: [
      { name: 'seoTitle', label: 'Title', type: 'text' },
      { name: 'seoDescription', label: 'Description', type: 'textarea' },
      { name: 'crumb', label: 'Название в хлебных крошках', type: 'text' },
      {
        type: 'row',
        fields: [
          { name: 'crumbParentTitle', label: 'Родительское звено', type: 'text', admin: { width: '40%', description: 'Например «О компании»' } },
          { name: 'crumbParentUrl', label: 'Его ссылка', type: 'text', admin: { width: '30%' } },
          {
            name: 'crumbVariant',
            label: 'Цвет крошек',
            type: 'select',
            defaultValue: 'default',
            options: [
              { label: 'Обычные', value: 'default' },
              { label: 'Синие', value: 'breadcrumbs_blue' },
            ],
            admin: { width: '30%' },
          },
        ],
      },
    ],
  },
]

export const expertisePageShape = pick(otherShapes.expertisePage, {
  expertiseElector: ['tag', 'title', 'background'],
  callback: true,
  journal: true,
})
export const catalogPageShape = pick(otherShapes.catalogPage, {
  catalog: ['title', 'url', 'description', 'background'],
  callback: true,
})
const jobsView = ['background', 'hashToScroll']
export const careerPageShape: Shape = {
  kind: 'object',
  props: [
    { key: 'vacancies', shape: (pick(otherShapes.jobsPage, { jobs: jobsView }) as Extract<Shape, { kind: 'object' }>).props[0].shape, required: false },
    { key: 'internships', shape: (pick(otherShapes.jobsPage, { jobs: jobsView }) as Extract<Shape, { kind: 'object' }>).props[0].shape, required: false },
    ...propsOf(pick(otherShapes.jobsCommon, { callback: true })),
  ],
}
export const partnersPageShape = pick(otherShapes.companionsPage, { companions: ['title'], callback: true })

const SECTION = 'Разделы сайта'

export const sectionGlobals: GlobalConfig[] = [
  { ...shapeGlobal('expertise-page', 'Центр экспертизы', expertisePageShape, ['expertise', 'detail'], 'Заголовок, фон, форма и блок журнала. Карточки берутся из публикаций и проектов', metaFields, SECTION), dbName: 'sec_xp' },
  { ...shapeGlobal('catalog-page', 'Каталог услуг', catalogPageShape, ['services'], 'Тексты страницы /services/. Карточки берутся из услуг', metaFields, SECTION), dbName: 'sec_cat' },
  { ...shapeGlobal('career-page', 'Вакансии и стажировки', careerPageShape, ['vacancies', 'internships', 'jobs', 'job-detail'], 'Фоны списков и форма «Не нашли вакансию?»', metaFields, SECTION), dbName: 'sec_car' },
  { ...shapeGlobal('partners-page', 'Страница партнёров', partnersPageShape, ['companions'], 'Заголовок и форма. Карточки берутся из коллекции «Партнёры»', metaFields, SECTION), dbName: 'sec_prt' },
]
