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
          { label: 'Выбор из списка', value: 'select' },
          { label: 'Несколько галочек', value: 'checkboxes' },
          { label: 'Дата', value: 'date' },
          { label: '— Новый шаг формы —', value: 'step' },
        ],
        admin: { width: '20%' },
      },
      {
        name: 'name',
        label: 'Имя поля',
        type: 'text',
        validate: (value: string | null | undefined, { siblingData }: { siblingData: { type?: string } }) =>
          siblingData?.type === 'step' || !!value || 'Обязательное поле',
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
    name: 'options',
    label: 'Варианты ответа',
    type: 'array',
    labels: { singular: 'вариант', plural: 'Варианты' },
    admin: { condition: (_, row) => row?.type === 'select' || row?.type === 'checkboxes', initCollapsed: false },
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'label', label: 'Текст', type: 'text', required: true, admin: { width: '60%' } },
          { name: 'value', label: 'Значение (латиницей)', type: 'text', admin: { width: '40%', description: 'Если пусто — как текст' } },
        ],
      },
    ],
  },
  {
    type: 'row',
    admin: { condition: (_, row) => row?.type !== 'step' },
    fields: [
      { name: 'showIfName', label: 'Показывать, только если поле…', type: 'text', admin: { width: '50%', description: 'Имя другого поля формы' } },
      { name: 'showIfValue', label: '…имеет значение', type: 'text', admin: { width: '50%' } },
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
      type: 'collapsible',
      label: 'Сообщение после отправки',
      admin: { initCollapsed: true, description: 'Если пусто — стандартное «Данные успешно отправлены»' },
      fields: [
        { name: 'successTitle', label: 'Заголовок', type: 'text', localized: true },
        { name: 'successText', label: 'Текст', type: 'textarea', localized: true },
      ],
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
  type: 'input' | 'phone' | 'textarea' | 'file' | 'select' | 'checkboxes' | 'date' | 'step'
  options?: { label: string; value?: string | null }[] | null
  showIfName?: string | null
  showIfValue?: string | null
  name?: string | null
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
  successTitle?: string | null
  successText?: string | null
  visible?: FormField[] | null
  hidden?: FormField[] | null
  btn?: string | null
  action?: string | null
}

const fieldToFront = (f: FormField) => {
  if (f.type === 'step') return { type: 'step', data: { name: f.name || 'step', ...(f.label ? { label: f.label } : {}) } }
  const data: Record<string, unknown> = { name: f.name ?? '' }
  if (f.type === 'select' || f.type === 'checkboxes') data.options = (f.options ?? []).map((o) => ({ label: o.label, value: o.value || o.label }))
  if (f.showIfName && f.showIfValue) data.showIf = { name: f.showIfName, value: f.showIfValue }
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
    if (f.sameRow && prev && f.type !== 'step' && prev.type !== 'step') {
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
  if (doc.successTitle || doc.successText) out.success = { ...(doc.successTitle ? { title: doc.successTitle } : {}), ...(doc.successText ? { text: doc.successText } : {}) }
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
