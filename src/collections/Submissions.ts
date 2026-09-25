/**
 * Заявки с сайта и файлы к ним (резюме и т. п.).
 * Бизнес-запросы видят администратор и редактор, отклики на вакансии — администратор и HR.
 */
import path from 'node:path'

import type { Access, CollectionConfig, Where } from 'payload'

import { hasRole, roleOf } from '../access'

export const FORM_KINDS = [
  { label: 'Бизнес-запрос', value: 'business' },
  { label: 'Отклик на вакансию', value: 'vacancy' },
  { label: 'Качество сервисной поддержки', value: 'quality' },
  { label: 'Сообщить об инциденте', value: 'incident' },
] as const

export type FormKind = (typeof FORM_KINDS)[number]['value']

export const CHANNELS = [
  { label: 'Письмо', value: 'email' },
  { label: 'Битрикс24', value: 'bitrix24' },
  { label: 'FriendWork', value: 'friendwork' },
] as const

export const DELIVERY_STATUSES = [
  { label: 'В очереди', value: 'pending' },
  { label: 'Отправлено', value: 'sent' },
  { label: 'Ошибка, будет повтор', value: 'retry' },
  { label: 'Не удалось', value: 'failed' },
  { label: 'Не подключено', value: 'skipped' },
] as const

/** Кто какие заявки видит: HR — только отклики, редактор — всё, кроме откликов. */
const submissionsWhere: Access = ({ req }) => {
  const role = roleOf(req)
  if (role === 'admin') return true
  if (role === 'hr') return { kind: { equals: 'vacancy' } } as Where
  if (role === 'editor') return { kind: { not_equals: 'vacancy' } } as Where
  return false
}

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'summary',
    group: 'Формы',
    defaultColumns: ['summary', 'kind', 'formTitle', 'status', 'deliveryState', 'createdAt'],
    listSearchableFields: ['summary', 'search'],
    description: 'Всё, что отправили через формы сайта. Заявки старше срока хранения удаляются автоматически',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: '-createdAt',
  access: {
    read: submissionsWhere,
    update: submissionsWhere,
    // заявки создаёт только сайт
    create: () => false,
    delete: hasRole('admin'),
  },
  fields: [
    { name: 'summary', label: 'Заявка', type: 'text', admin: { readOnly: true, condition: () => false } },
    {
      type: 'row',
      fields: [
        { name: 'kind', label: 'Тип', type: 'select', options: [...FORM_KINDS], index: true, admin: { readOnly: true, width: '33%' } },
        {
          name: 'status',
          label: 'Статус',
          type: 'select',
          defaultValue: 'new',
          index: true,
          options: [
            { label: 'Новая', value: 'new' },
            { label: 'В работе', value: 'progress' },
            { label: 'Обработана', value: 'done' },
            { label: 'Спам', value: 'spam' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'deliveryState',
          label: 'Отправка',
          type: 'select',
          options: [
            { label: 'В очереди', value: 'pending' },
            { label: 'Отправлено', value: 'sent' },
            { label: 'Есть ошибки', value: 'failed' },
          ],
          defaultValue: 'pending',
          admin: { readOnly: true, width: '33%' },
        },
      ],
    },
    {
      name: 'fields',
      label: 'Что заполнили',
      type: 'array',
      admin: { readOnly: true, hidden: true },
      labels: { singular: 'поле', plural: 'Поля' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'Поле', type: 'text', admin: { width: '30%' } },
            { name: 'value', label: 'Значение', type: 'textarea', admin: { width: '70%' } },
          ],
        },
        { name: 'name', type: 'text', admin: { hidden: true } },
      ],
    },
    { name: 'files', label: 'Файлы', type: 'upload', relationTo: 'submission-files', hasMany: true, admin: { readOnly: true, hidden: true } },
    {
      name: 'card',
      type: 'ui',
      admin: { components: { Field: '/components/SubmissionView#SubmissionView' } },
    },
    { name: 'comment', label: 'Комментарий менеджера', type: 'textarea', admin: { description: 'Видят только сотрудники' } },
    {
      name: 'deliveries',
      label: 'Журнал отправки',
      type: 'array',
      admin: { readOnly: true, hidden: true },
      labels: { singular: 'отправка', plural: 'Журнал отправки' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'channel', label: 'Куда', type: 'select', options: [...CHANNELS], admin: { width: '20%' } },
            { name: 'status', label: 'Статус', type: 'select', options: [...DELIVERY_STATUSES], admin: { width: '20%' } },
            { name: 'attempts', label: 'Попыток', type: 'number', admin: { width: '15%' } },
            { name: 'at', label: 'Когда', type: 'date', admin: { width: '20%', date: { pickerAppearance: 'dayAndTime' } } },
            { name: 'target', label: 'Получатели', type: 'text', admin: { width: '25%' } },
          ],
        },
        { name: 'error', label: 'Ошибка', type: 'text' },
      ],
    },
    // сведения об источнике — справа
    { name: 'form', label: 'Шаблон формы', type: 'relationship', relationTo: 'forms', admin: { position: 'sidebar', readOnly: true } },
    { name: 'formTitle', label: 'Форма', type: 'text', admin: { readOnly: true, condition: () => false } },
    { name: 'page', label: 'Страница', type: 'text', admin: { hidden: true } },
    { name: 'locale', label: 'Язык', type: 'text', admin: { hidden: true } },
    { name: 'utm', label: 'Метки (UTM)', type: 'json', admin: { hidden: true } },
    { name: 'recipients', label: 'Получатели письма', type: 'text', admin: { hidden: true } },
    { name: 'captcha', label: 'Капча', type: 'text', admin: { hidden: true } },
    { name: 'ipHash', type: 'text', admin: { hidden: true } },
    { name: 'search', label: 'текст заявки', type: 'text', admin: { hidden: true } },
    { name: 'data', type: 'json', admin: { hidden: true } },
  ],
  hooks: {
    afterDelete: [
      // вместе с заявкой удаляются её файлы
      async ({ doc, req }) => {
        const ids = ((doc as { files?: unknown[] }).files ?? []).map((f) => (f && typeof f === 'object' ? (f as { id: number }).id : f))
        if (ids.length) {
          await req.payload.delete({ collection: 'submission-files', where: { id: { in: ids } }, overrideAccess: true, req })
        }
      },
    ],
  },
  timestamps: true,
}

/** Файлы из форм лежат отдельно от медиатеки и не доступны без входа в админку. */
export const SubmissionFiles: CollectionConfig = {
  slug: 'submission-files',
  labels: { singular: 'Файл заявки', plural: 'Файлы заявок' },
  admin: { hidden: true },
  access: {
    read: hasRole('admin', 'editor', 'hr'),
    create: () => false,
    update: () => false,
    delete: hasRole('admin'),
  },
  upload: {
    // не в папке медиатеки: файлы отдаются только через API с проверкой прав
    staticDir: process.env.PRIVATE_UPLOADS_DIR || path.resolve(process.cwd(), 'private-uploads'),
  },
  fields: [],
}
