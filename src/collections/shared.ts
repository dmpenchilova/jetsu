/**
 * Общие куски для коллекций контента: доступы, символьный код, картинки, SEO, сброс кэша.
 */
import type { CollectionConfig, Field, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { canPublish, hasRole, isLoggedIn, type Role } from '../access'
import { imageFields } from '../blocks/fields'
import { revalidateFront } from '../lib/revalidate'

/** Доступ: читать могут все вошедшие, править — перечисленные роли, удалять — администратор и редактор. */
export const contentAccess = (...editors: Role[]): CollectionConfig['access'] => ({
  read: isLoggedIn,
  readVersions: isLoggedIn,
  create: hasRole('admin', 'editor', ...editors),
  update: hasRole('admin', 'editor', ...editors),
  delete: hasRole('admin', 'editor'),
})

/** Справочники правит только администратор и редактор. */
export const dictAccess: CollectionConfig['access'] = {
  read: isLoggedIn,
  create: hasRole('admin', 'editor'),
  update: hasRole('admin', 'editor'),
  delete: hasRole('admin', 'editor'),
}

const translit: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

/** Символьный код из названия: латиница, цифры, дефис. */
export const slugify = (text: string) =>
  text
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
    .split('')
    .map((ch) => translit[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

/** Поле «Символьный код»: заполняется само из названия, проверяется на формат. */
export const slugField = (from = 'title', options: { unique?: boolean; description?: string } = {}): Field => ({
  name: 'slug',
  label: 'Символьный код',
  type: 'text',
  index: true,
  unique: options.unique ?? true,
  admin: {
    position: 'sidebar',
    description: options.description ?? 'Часть адреса. Если пусто — создаётся из названия',
  },
  validate: (value: string | null | undefined) =>
    !value || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) || 'Только строчная латиница, цифры и дефис',
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (value) return value
        const source = data?.[from]
        return typeof source === 'string' && source ? slugify(source) : value
      },
    ],
  },
})

/** Картинка с вариантами для планшета и десктопа — то же, что в блоках. */
export const imageGroup = (name: string, label: string, options: { required?: boolean; background?: boolean; description?: string } = {}): Field => ({
  name,
  label,
  type: 'group',
  admin: options.description ? { description: options.description } : undefined,
  fields: imageFields(options.required ?? false, options.background ?? false),
})

/** Кнопка: текст и ссылка. */
export const linkGroup = (name: string, label: string, defaultTitle?: string): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', label: 'Текст', type: 'text', defaultValue: defaultTitle, admin: { width: '40%' } },
        { name: 'url', label: 'Ссылка', type: 'text', admin: { width: '60%' } },
      ],
    },
  ],
})

/** Вкладка SEO для записей со своей страницей. */
export const seoFields: Field = {
  name: 'seo',
  label: 'SEO',
  type: 'group',
  admin: { description: 'Если пусто — title берётся из названия' },
  fields: [
    { name: 'title', label: 'Title', type: 'text', localized: true },
    { name: 'description', label: 'Description', type: 'textarea', localized: true },
    { name: 'keywords', label: 'Keywords', type: 'text', localized: true },
  ],
}

/** Запрет публикации для ролей без права публиковать. */
export const guardPublish = ({ data, req }: { data: Record<string, unknown>; req: PayloadRequest }) => {
  if (req.user && data._status === 'published' && !canPublish(req)) {
    throw new APIError('Публиковать могут редактор и администратор. Сохраните черновик.', 403, undefined, true)
  }
  return data
}

/** Хуки сброса кэша фронта после сохранения и удаления. */
export const revalidateHooks = (tags: string[] | ((doc: Record<string, unknown>) => string[])): CollectionConfig['hooks'] => {
  const tagsOf = (doc: Record<string, unknown>) => (typeof tags === 'function' ? tags(doc) : tags)
  return {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        const status = (doc as { _status?: string })._status
        const prevStatus = (previousDoc as { _status?: string } | undefined)?._status
        // черновики не трогают сайт
        if (status === undefined || status === 'published' || prevStatus === 'published') {
          await revalidateFront(req.payload, tagsOf(doc))
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await revalidateFront(req.payload, tagsOf(doc))
      },
    ],
  }
}

/** Черновики, версии и публикация по расписанию. */
export const drafts: CollectionConfig['versions'] = {
  maxPerDoc: 30,
  drafts: { autosave: { interval: 2000 }, schedulePublish: true },
}
