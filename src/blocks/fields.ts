import type { Block, Field } from 'payload'

import { BLOCK_META, FIELD_LABELS, LONG_TEXT_KEYS, OPTION_LABELS } from './meta'
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
        ? { name, label: label(key), type: 'textarea', required }
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
  return f ? [{ ...f, label: 'Текст', type: f.type === 'text' ? 'textarea' : f.type } as Field] : []
}

export const objectFields = (props: Prop[], parentRequired: boolean): Field[] =>
  props.map((p) => propField(p, parentRequired)).filter((f): f is Field => f !== null)

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
]

export const buildBlock = (type: string, shape: Shape): Block => {
  const meta = BLOCK_META[type] ?? { label: type, group: 'Прочее' }
  const props = shape.kind === 'object' ? shape.props : []
  const hasNav = props.some((p) => p.key === 'navTitle')
  const own = props.filter((p) => p.key !== 'hash' && p.key !== 'navTitle')
  return {
    slug: type,
    labels: { singular: meta.label, plural: meta.label },
    imageURL: `/blocks/${type}.webp`,
    imageAltText: meta.label,
    admin: {
      group: meta.group,
      ...(meta.hint ? { custom: { hint: meta.hint } } : {}),
    },
    fields: [...commonBlockFields(hasNav), ...objectFields(own, true)],
  }
}
