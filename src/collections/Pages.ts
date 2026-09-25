import type { CollectionConfig, Where } from 'payload'
import { APIError } from 'payload'

import { canPublish, hasRole, isLoggedIn } from '../access'
import { pageBlocks } from '../blocks'
import { previewUrl } from '../lib/preview'
import { builderTag, revalidateFront } from '../lib/revalidate'
import { autoRedirect } from './Redirects'

type PageDoc = {
  id: number | string
  path?: string | null
  slug?: string | null
  parent?: number | string | { id: number | string } | null
  _status?: 'draft' | 'published' | null
}

const strip = (v: unknown) =>
  typeof v === 'string'
    ? v.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    : ''

/** Подпись блока в списке: заголовок или надзаголовок, у скрытых — пометка. */
const nameBlocks = (rows: unknown) => {
  if (!Array.isArray(rows)) return rows
  return rows.map((row: Record<string, unknown>) => {
    const text = strip(row.title) || strip(row.tag) || strip(row.navTitle) || strip(row.subtitle) || strip(row.description)
    const short = text.length > 70 ? `${text.slice(0, 70)}…` : text
    return { ...row, blockName: `${row.hidden ? '[скрыт] ' : ''}${short}` }
  })
}

const parentId = (p: PageDoc['parent']) => (p && typeof p === 'object' ? p.id : p) ?? null

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Страница', plural: 'Страницы' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'path', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'path'],
    group: 'Контент',
    description: 'Страницы сайта, которые собираются из блоков',
    livePreview: {
      url: ({ data, locale }) => {
        if (!data?.id) return null
        const code = typeof locale === 'string' ? locale : locale?.code
        return previewUrl({ id: String(data.id), locale: code === 'en' ? 'en' : 'ru' })
      },
      breakpoints: [
        { label: 'Десктоп 1440', name: 'desktop', width: 1440, height: 900 },
        { label: 'Планшет 768', name: 'tablet', width: 768, height: 1024 },
        { label: 'Телефон 375', name: 'mobile', width: 375, height: 812 },
      ],
    },
  },
  access: {
    read: isLoggedIn,
    create: hasRole('admin', 'editor', 'author'),
    update: hasRole('admin', 'editor', 'author'),
    delete: hasRole('admin', 'editor'),
    readVersions: isLoggedIn,
  },
  versions: {
    maxPerDoc: 50,
    drafts: {
      autosave: { interval: 2000 },
      schedulePublish: true,
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        if (req.user && data._status === 'published' && !canPublish(req)) {
          throw new APIError('Публиковать могут редактор и администратор. Сохраните черновик.', 403, undefined, true)
        }
        // путь страницы = путь родителя + символьный код
        const slug = (data.slug ?? '').trim()
        const pid = parentId(data.parent ?? originalDoc?.parent)
        let parentPath = ''
        if (pid) {
          if (originalDoc && String(pid) === String(originalDoc.id)) {
            throw new APIError('Страница не может быть родителем самой себя', 400, undefined, true)
          }
          const parent = await req.payload.findByID({ collection: 'pages', id: pid, depth: 0, draft: true, req, overrideAccess: true })
          parentPath = (parent.path as string) ?? ''
          if (!slug) throw new APIError('У вложенной страницы должен быть символьный код', 400, undefined, true)
        }
        data.path = [parentPath, slug].filter(Boolean).join('/')
        data.content = nameBlocks(data.content)

        const where: Where = { path: { equals: data.path } }
        if (originalDoc?.id) where.id = { not_equals: originalDoc.id }
        const { totalDocs } = await req.payload.count({ collection: 'pages', where, req, overrideAccess: true })
        if (totalDocs > 0) {
          throw new APIError(`Адрес /${data.path}${data.path ? '/' : ''} уже занят другой страницей`, 400, undefined, true)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        const page = doc as PageDoc
        const prev = previousDoc as PageDoc | undefined
        // при смене адреса обновляем адреса вложенных страниц
        if (prev?.path !== undefined && prev.path !== page.path && !context.skipChildren) {
          const children = await req.payload.find({
            collection: 'pages',
            where: { parent: { equals: page.id } },
            depth: 0,
            limit: 1000,
            draft: true,
            req,
            overrideAccess: true,
          })
          for (const child of children.docs) {
            await req.payload.update({ collection: 'pages', id: child.id, data: {}, draft: child._status !== 'published', req, overrideAccess: true })
          }
        }
        // опубликованная страница сменила адрес — старый ведёт на новый
        if (prev?.path !== undefined && prev.path !== page.path && page._status === 'published' && prev._status === 'published') {
          await autoRedirect(req.payload, `/${prev.path ?? ''}/`, `/${page.path ?? ''}/`)
        }
        if (page._status === 'published' || prev?._status === 'published') {
          const tags = [builderTag(page.path ?? '')]
          if (prev?.path !== undefined && prev.path !== page.path) tags.push(builderTag(prev.path ?? ''))
          await revalidateFront(req.payload, tags)
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await revalidateFront(req.payload, [builderTag((doc as PageDoc).path ?? '')])
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Содержимое',
          fields: [
            { name: 'title', label: 'Название', type: 'text', required: true, localized: true },
            {
              name: 'content',
              label: 'Блоки',
              type: 'blocks',
              localized: true,
              blocks: pageBlocks,
              labels: { singular: 'блок', plural: 'Блоки' },
              admin: { initCollapsed: true },
            },
          ],
        },
        {
          label: 'Адрес и крошки',
          fields: [
            {
              name: 'slug',
              label: 'Символьный код',
              type: 'text',
              index: true,
              admin: { description: 'Латиница, цифры и дефис. У главной страницы пусто.' },
              validate: (value: string | null | undefined) =>
                !value || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) || 'Только строчная латиница, цифры и дефис',
            },
            {
              name: 'parent',
              label: 'Родительская страница',
              type: 'relationship',
              relationTo: 'pages',
              admin: { description: 'Задаёт адрес и хлебные крошки' },
            },
            {
              name: 'path',
              label: 'Адрес на сайте',
              type: 'text',
              unique: true,
              index: true,
              admin: { readOnly: true, description: 'Собирается сам из родителя и символьного кода' },
            },
            {
              name: 'breadcrumbs',
              label: 'Хлебные крошки',
              type: 'group',
              fields: [
                { name: 'show', label: 'Показывать', type: 'checkbox', defaultValue: true },
                {
                  name: 'variant',
                  label: 'Цвет',
                  type: 'select',
                  defaultValue: 'default',
                  options: [
                    { label: 'Обычные', value: 'default' },
                    { label: 'Синие (на тёмном фоне)', value: 'breadcrumbs_blue' },
                  ],
                },
                {
                  name: 'title',
                  label: 'Текст последнего звена',
                  type: 'text',
                  localized: true,
                  admin: { description: 'Если пусто — название страницы' },
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          name: 'seo',
          fields: [
            { name: 'title', label: 'Title', type: 'text', localized: true, admin: { description: 'Если пусто — название страницы' } },
            { name: 'description', label: 'Description', type: 'textarea', localized: true },
            { name: 'keywords', label: 'Keywords', type: 'text', localized: true },
            {
              name: 'robots',
              label: 'Robots',
              type: 'select',
              options: [
                { label: 'index, follow', value: 'index, follow' },
                { label: 'noindex, follow', value: 'noindex, follow' },
                { label: 'noindex, nofollow', value: 'noindex, nofollow' },
              ],
            },
            { name: 'image', label: 'Картинка для соцсетей', type: 'upload', relationTo: 'media' },
          ],
        },
      ],
    },
  ],
}
