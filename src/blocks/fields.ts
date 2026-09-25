import type { Block, Field } from 'payload'

import { BINDINGS } from './bindings'
import { BLOCK_META, FIELD_LABELS, LONG_TEXT_KEYS, OPTION_LABELS } from './meta'

/** Визуальный редактор с режимом HTML для длинных текстов. */
export const HTML_EDITOR = '/components/HtmlEditor#HtmlEditor'
import { nameOf, type Prop, type Shape } from './shape'

/** Пустое значение select-поля фронта ('') хранится в админке как 'default'. */
export const EMPTY_OPTION = 'default'

const label = (key: string) => FIELD_LABELS[key] ?? key

const optionLabel = (value: string) => OPTION_LABELS[value] ?? value

/** Поля картинки: основной файл, варианты для планшета и десктопа, alt; у фона ещё тип. */
export const imageFields = (required: boolean, background: boolean): Field[] => [
  {
    type: 'row',
    fields: [
      {
        name: 'src',
        label: background ? 'Файл (картинка или видео mp4)' : 'Картинка',
        type: 'upload',
        relationTo: 'media',
        required,
        admin: { width: '50%' },
      },
      {
        name: 'alt',
        label: 'Alt-текст',
        type: 'text',
        admin: { width: '50%', description: 'Если пусто — берётся из медиатеки' },
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'Другие файлы для планшета и десктопа',
    admin: { initCollapsed: true },
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'tablet', label: 'Для планшета', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
          { name: 'desktop', label: 'Для десктопа', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
        ],
      },
      ...(background
        ? [
            {
              name: 'type',
              label: 'Тип фона',
              type: 'select',
              defaultValue: 'mixed',
              options: ['mixed', 'image', 'video'].map((v) => ({ label: optionLabel(v), value: v })),
            } as Field,
          ]
        : []),
    ],
  },
]

/** Поля одного свойства. required учитывается, только если обязательны и все родители. */
const propField = (prop: Prop, parentRequired: boolean): Field | null => {
  const { key, shape } = prop
  const required = parentRequired && prop.required
  const name = nameOf(prop)
  switch (shape.kind) {
    case 'string':
      if (shape.options) {
        const options = shape.options.map((v) => ({ label: optionLabel(v || EMPTY_OPTION), value: v || EMPTY_OPTION }))
        return {
          name,
          label: label(key),
          type: 'select',
          options,
          required,
          defaultValue: shape.options.includes('') ? EMPTY_OPTION : undefined,
        }
      }
      return LONG_TEXT_KEYS.has(key)
        ? { name, label: label(key), type: 'textarea', required, admin: { components: { Field: HTML_EDITOR } } }
        : { name, label: label(key), type: 'text', required }
    case 'boolean':
      return { name, label: label(key), type: 'checkbox' }
    case 'number':
      return { name, label: label(key), type: 'number', required }
    case 'image':
      return {
        name,
        label: label(key),
        type: 'group',
        fields: imageFields(required, shape.background),
      }
    case 'form':
      return {
        name,
        label: 'Шаблон формы',
        type: 'relationship',
        relationTo: 'forms',
        required,
      }
    case 'record':
      return {
        name,
        label: label(key),
        type: 'array',
        labels: { singular: 'параметр', plural: label(key) },
        admin: { description: 'Параметры ссылки, например tema = cod' },
        fields: [
          {
            type: 'row',
            fields: [
              { name: 'key', label: 'Параметр', type: 'text', required: true, admin: { width: '50%' } },
              { name: 'value', label: 'Значение', type: 'text', required: true, admin: { width: '50%' } },
            ],
          },
        ],
      }
    case 'object':
      return {
        name,
        label: label(key),
        type: 'group',
        fields: objectFields(shape.props, required),
      }
    case 'array':
      return {
        name,
        label: label(key),
        type: 'array',
        required: required && prop.required,
        labels: { singular: 'элемент', plural: label(key) },
        admin: { initCollapsed: true },
        fields: rowFields(shape.of),
      }
    case 'union':
      return {
        name,
        label: label(key),
        type: 'blocks',
        required,
        blocks: shape.variants.map((v) => ({
          slug: v.value,
          labels: { singular: optionLabel(v.value), plural: optionLabel(v.value) },
          fields: variantFields(v.data),
        })),
      }
    default:
      return null
  }
}

/** Поля строки массива. */
const rowFields = (of: Shape): Field[] => {
  switch (of.kind) {
    case 'object':
      return objectFields(of.props, true)
    case 'image':
      return imageFields(true, of.background)
    case 'array':
      return [{ name: 'items', label: 'Ячейки', type: 'array', fields: rowFields(of.of) }]
    default: {
      const f = propField({ key: 'value', shape: of, required: true }, true)
      return f ? [{ ...f, label: 'Значение' } as Field] : []
    }
  }
}

/** Поля варианта подблока (например, «цитата» внутри тела публикации). */
const variantFields = (data: Shape): Field[] => {
  if (data.kind === 'object') return objectFields(data.props, true)
  const f = propField({ key: 'value', shape: data, required: true }, true)
  return f
    ? [{ ...f, label: 'Текст', ...(f.type === 'text' ? { type: 'textarea', admin: { components: { Field: HTML_EDITOR } } } : {}) } as Field]
    : []
}

/** Порядок полей в форме: сначала надзаголовок, заголовок и текст, потом всё остальное — как в схеме. */
const FIRST = ['tag', 'supTag', 'suptitle', 'title', 'secondTitle', 'subtitle', 'subTitle', 'name', 'position', 'postion', 'description', 'text']
const rank = (key: string) => {
  const i = FIRST.indexOf(key)
  return i === -1 ? FIRST.length : i
}

export const objectFields = (props: Prop[], parentRequired: boolean): Field[] =>
  [...props]
    .sort((a, b) => rank(a.key) - rank(b.key))
    .map((p) => propField(p, parentRequired))
    .filter((f): f is Field => f !== null)

/** Поля, общие для всех блоков страницы. */
const commonBlockFields = (hasNav: boolean): Field[] => [
  {
    type: 'row',
    fields: [
      {
        name: 'hidden',
        label: 'Скрыть блок',
        type: 'checkbox',
        admin: { width: '20%', description: 'Скрытый блок не попадает на сайт' },
      },
      ...(hasNav
        ? ([
            {
              name: 'navTitle',
              label: 'Название в навигации',
              type: 'text',
              admin: { width: '40%', description: 'Без него блока нет в плавающей навигации' },
            },
            {
              name: 'hash',
              label: 'Якорь',
              type: 'text',
              admin: { width: '40%', description: 'Латиница без #, например services' },
            },
          ] as Field[])
        : []),
    ],
  },
  // ссылка «Открыть превью блока» — только этот блок, в трёх размерах экрана
  { name: 'blockPreview', type: 'ui', admin: { components: { Field: '/components/BlockPreview#BlockPreview' } } },
]

/** Выбор источника данных для блоков, связанных с коллекциями. */
const sourceFields = (b: { collection: string; auto?: string; limit?: number }): Field[] => [
  {
    type: 'row',
    fields: [
      {
        name: 'source',
        label: 'Откуда брать записи',
        type: 'select',
        defaultValue: 'manual',
        options: [
          { label: 'Заполнить вручную', value: 'manual' },
          ...(b.auto ? [{ label: `Автоматически: ${b.auto}`, value: 'auto' }] : []),
          { label: 'Выбрать записи', value: 'pick' },
        ],
        admin: { width: '50%' },
      },
      {
        name: 'limit',
        label: 'Сколько показать',
        type: 'number',
        defaultValue: b.limit,
        admin: { width: '25%', condition: (_, sibling) => sibling?.source === 'auto', description: 'Пусто — все' },
      },
    ],
  },
  {
    name: 'pick',
    label: 'Записи',
    type: 'relationship',
    relationTo: b.collection as never,
    hasMany: true,
    admin: { condition: (_, sibling) => sibling?.source === 'pick', description: 'Порядок на сайте — как здесь' },
  },
]

export const buildBlock = (type: string, shape: Shape): Block => {
  const meta = BLOCK_META[type] ?? { label: type, group: 'Прочее' }
  const props = shape.kind === 'object' ? shape.props : []
  const hasNav = props.some((p) => p.key === 'navTitle')
  const binding = BINDINGS[type]
  // поле, которое может заполняться из коллекции, необязательно: при автоматическом источнике оно пустое
  const own = props
    .filter((p) => p.key !== 'hash' && p.key !== 'navTitle')
    .map((p) => (binding && p.key === binding.prop ? { ...p, required: false } : p))
  const ownFields = objectFields(own, true).map((f) =>
    binding && 'name' in f && f.name === binding.prop
      ? ({ ...f, admin: { ...(f.admin ?? {}), condition: (_: unknown, sibling: Record<string, unknown>) => !sibling?.source || sibling.source === 'manual' } } as Field)
      : f,
  )
  return {
    slug: type,
    labels: { singular: meta.label, plural: meta.label },
    imageURL: `/blocks/${type}.webp`,
    imageAltText: meta.label,
    admin: {
      group: meta.group,
      ...(meta.hint ? { custom: { hint: meta.hint } } : {}),
    },
    fields: [...commonBlockFields(hasNav), ...(binding ? sourceFields(binding) : []), ...ownFields],
  }
}
