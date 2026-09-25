import type { CollectionConfig, Field } from 'payload'

import { hasRole, isLoggedIn } from '../access'
import { emailsField } from '../globals/formSettings'
import { FORM_KINDS } from './Submissions'

const fieldRow: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'type',
        label: 'Тип',
        type: 'select',
        required: true,
        defaultValue: 'input',
        options: [
          { label: 'Строка', value: 'input' },
          { label: 'Телефон', value: 'phone' },
          { label: 'Текст', value: 'textarea' },
          { label: 'Файл', value: 'file' },
        ],
        admin: { width: '20%' },
      },
      {
        name: 'name',
        label: 'Имя поля',
        type: 'text',
        required: true,
        admin: { width: '20%', description: 'Латиницей, уходит в письмо и CRM' },
      },
      { name: 'placeholder', label: 'Подсказка в поле', type: 'text', admin: { width: '30%' } },
      { name: 'label', label: 'Подпись над полем', type: 'text', admin: { width: '30%' } },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'validations',
        label: 'Проверки',
        type: 'select',
        hasMany: true,
        options: [
          { label: 'Обязательное', value: 'required' },
          { label: 'E-mail', value: 'email' },
          { label: 'Телефон', value: 'phone' },
          { label: 'Файл', value: 'file' },
        ],
        admin: { width: '40%' },
      },
      {
        name: 'sameRow',
        label: 'В одной строке с предыдущим',
        type: 'checkbox',
        admin: { width: '30%' },
      },
      {
        name: 'multiple',
        label: 'Несколько файлов',
        type: 'checkbox',
        admin: { width: '30%', condition: (_, row) => row?.type === 'file' },
      },
    ],
  },
  {
    name: 'acceptedFileTypes',
    label: 'Разрешённые типы файлов',
    type: 'text',
    hasMany: true,
    admin: { condition: (_, row) => row?.type === 'file', description: 'Например .pdf, .docx' },
  },
  { name: 'defaultValue', label: 'Значение по умолчанию', type: 'text' },
]

export const Forms: CollectionConfig = {
  slug: 'forms',
  labels: { singular: 'Шаблон формы', plural: 'Шаблоны форм' },
  admin: {
    useAsTitle: 'title',
    group: 'Формы',
    defaultColumns: ['title', 'kind', 'updatedAt'],
  },
  access: {
    read: isLoggedIn,
    create: hasRole('admin'),
    update: hasRole('admin'),
    delete: hasRole('admin'),
  },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          label: 'Тип формы',
          type: 'select',
          required: true,
          defaultValue: 'business',
          options: [...FORM_KINDS],
          admin: { width: '50%', description: 'По типу выбираются получатели писем и интеграции' },
        },
        {
          name: 'center',
          label: 'Центр',
          type: 'relationship',
          relationTo: 'terms',
          filterOptions: { kind: { equals: 'center' } },
          admin: { width: '50%', description: 'Письмо уйдёт и на ящик центра' },
        },
      ],
    },
    emailsField('recipients', 'Дополнительные получатели', 'Кроме общих получателей из «Настроек форм»'),
    emailsField('cc', 'В копии'),
    {
      name: 'visible',
      label: 'Поля формы',
      type: 'array',
      localized: true,
      labels: { singular: 'поле', plural: 'Поля формы' },
      fields: fieldRow,
    },
    {
      name: 'hidden',
      label: 'Скрытые поля',
      type: 'array',
      localized: true,
      labels: { singular: 'поле', plural: 'Скрытые поля' },
      admin: { initCollapsed: true },
      fields: fieldRow,
    },
    {
      name: 'btn',
      label: 'Текст кнопки',
      type: 'text',
      localized: true,
      defaultValue: 'Отправить',
    },
    {
      name: 'action',
      type: 'text',
      // адрес отправки строится сам: /api/form/callback/?form=<id>
      admin: { hidden: true },
    },
  ],
}

type FormField = {
  type: 'input' | 'phone' | 'textarea' | 'file'
  name: string
  placeholder?: string | null
  label?: string | null
  validations?: ('required' | 'email' | 'phone' | 'file')[] | null
  sameRow?: boolean | null
  multiple?: boolean | null
  acceptedFileTypes?: string[] | null
  defaultValue?: string | null
}

type FormDoc = {
  id?: number | string
  visible?: FormField[] | null
  hidden?: FormField[] | null
  btn?: string | null
  action?: string | null
}

const fieldToFront = (f: FormField) => {
  const data: Record<string, unknown> = { name: f.name }
  if (f.placeholder && f.type !== 'file') data.placeholder = f.placeholder
  if (f.label) data.label = f.label
  if (f.validations?.length) data.validations = f.validations
  if (f.defaultValue) data.defaultValue = f.defaultValue
  if (f.type === 'file') {
    data.acceptedFileTypes = f.acceptedFileTypes ?? []
    if (f.multiple) data.multiple = true
  }
  return { type: f.type, data }
}

/** Поля подряд с флагом «в одной строке» собираются в строку type: 'row'. */
const listToFront = (fields: FormField[] | null | undefined) => {
  const out: unknown[] = []
  for (const f of fields ?? []) {
    const item = fieldToFront(f)
    const prev = out[out.length - 1] as { type: string; data: unknown } | undefined
    if (f.sameRow && prev) {
      if (prev.type === 'row') (prev.data as unknown[]).push(item)
      else out[out.length - 1] = { type: 'row', data: [prev, item] }
    } else {
      out.push(item)
    }
  }
  return out
}

export const formToFront = (doc: FormDoc) => {
  const out: Record<string, unknown> = { visible: listToFront(doc.visible) }
  const hidden = listToFront(doc.hidden)
  if (hidden.length) out.hidden = hidden
  if (doc.btn) out.btn = { title: doc.btn }
  // сайт отправляет заявку на этот адрес, по нему админка узнаёт форму
  if (doc.id !== undefined) out.action = `/api/form/callback/?form=${doc.id}`
  else if (doc.action) out.action = doc.action
  return out
}

type FrontField = { type: string; data: Record<string, unknown> }

/** Обратное преобразование — для импорта тестовых данных фронта. */
export const formFromFront = (form: { visible?: FrontField[]; hidden?: FrontField[]; btn?: { title?: string }; action?: string }) => {
  const list = (items: FrontField[] | undefined) => {
    const out: FormField[] = []
    for (const item of items ?? []) {
      const group = item.type === 'row' ? (item.data as unknown as FrontField[]) : [item]
      group.forEach((f, i) => {
        const d = f.data
        out.push({
          type: f.type as FormField['type'],
          name: String(d.name),
          placeholder: (d.placeholder as string) ?? null,
          label: (d.label as string) ?? null,
          validations: (d.validations as FormField['validations']) ?? [],
          sameRow: item.type === 'row' && i > 0,
          multiple: (d.multiple as boolean) ?? false,
          acceptedFileTypes: (d.acceptedFileTypes as string[]) ?? null,
          defaultValue: typeof d.defaultValue === 'string' ? d.defaultValue : null,
        })
      })
    }
    return out
  }
  return { visible: list(form.visible), hidden: list(form.hidden), btn: form.btn?.title ?? null, action: form.action ?? null }
}
