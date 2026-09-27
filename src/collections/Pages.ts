import type { CollectionConfig, Where } from 'payload'
import { APIError } from 'payload'

import { canPublish, hasRole, isLoggedIn } from '../access'
import { pageBlocks } from '../blocks'
import { SharedBlockRef, withoutIds } from './Library'
import { PollBlock } from './Polls'
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
    components: { beforeListTable: ['/components/PagesFromTemplate#PagesFromTemplate'] },
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
  endpoints: [
    {
      // новая страница из шаблона: POST /cms-api/pages/from-template { template }
      path: '/from-template',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Нужно войти в админку' }, { status: 401 })
        const body = (await req.json?.().catch(() => ({}))) as { template?: number }
        if (!body.template) return Response.json({ error: 'Не выбран шаблон' }, { status: 400 })
        const tpl = (await req.payload.findByID({ collection: 'page-templates', id: body.template, locale: 'all' as 'ru', depth: 0, overrideAccess: true })) as unknown as {
          title: string
          content?: Record<string, unknown[]>
        }
        const page = await req.payload.create({
          collection: 'pages',
          locale: 'ru',
          draft: true,
          data: { title: tpl.title.replace(/^Шаблон:\s*/, ''), content: withoutIds(tpl.content?.ru ?? []) as never, _status: 'draft' },
          user: req.user,
          overrideAccess: false,
          req,
        })
        if (tpl.content?.en?.length) {
          await req.payload.update({ collection: 'pages', id: page.id, locale: 'en', draft: true, data: { content: withoutIds(tpl.content.en) as never }, overrideAccess: true, req })
        }
        return Response.json({ id: page.id })
      },
    },
    {
      // проверка перед публикацией: /cms-api/pages/12/check?locale=ru
      path: '/:id/check',
      method: 'get',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Нужно войти в админку' }, { status: 401 })
        const url = new URL(req.url ?? '', 'http://x')
        const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'ru'
        const id = String(req.routeParams?.id ?? '')
        const page = await req.payload
          .findByID({ collection: 'pages', id, locale: 'all' as 'ru', depth: 0, draft: true, overrideAccess: true })
          .catch(() => null)
        if (!page) return Response.json({ error: 'not found' }, { status: 404 })
        const { checkPage } = await import('../lib/pageCheck')
        return Response.json({ issues: await checkPage(req.payload, page as never, locale) })
      },
    },
    {
      // ссылка на черновик для коллег без входа: /cms-api/pages/12/share-link?days=7&locale=ru
      path: '/:id/share-link',
      method: 'get',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Нужно войти в админку' }, { status: 401 })
        const url = new URL(req.url ?? '', 'http://x')
        const id = String(req.routeParams?.id ?? '')
        const days = Math.min(30, Math.max(1, Number(url.searchParams.get('days')) || 7))
        const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'ru'
        if (!/^\d+$/.test(id)) return Response.json({ error: 'bad request' }, { status: 400 })
        const link = previewUrl({ id, locale, days })
        if (!link) return Response.json({ error: 'Не задан адрес сайта (FRONT_URL)' }, { status: 500 })
        const { writeAudit } = await import('./AuditLog')
        await writeAudit({ req, action: 'update', target: `Страница № ${id}`, summary: `Ссылка на черновик на ${days} дн.` })
        return Response.json({ url: link, expires: new Date(Date.now() + days * 86400_000).toISOString() })
      },
    },
    {
      // превью одного блока: /cms-api/pages/12/preview-block?block=<id блока>&locale=ru
      path: '/:id/preview-block',
      method: 'get',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Нужно войти в админку' }, { status: 401 })
        const url = new URL(req.url ?? '', 'http://x')
        const id = String(req.routeParams?.id ?? '')
        const block = url.searchParams.get('block') ?? ''
        const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'ru'
        if (!/^\d+$/.test(id) || !/^[\w-]{1,64}$/.test(block)) return Response.json({ error: 'bad request' }, { status: 400 })
        const target = previewUrl({ id, locale, block })
        if (!target) return Response.json({ error: 'Не задан адрес сайта (FRONT_URL)' }, { status: 500 })
        return Response.redirect(target, 302)
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        if (req.user && data._status === 'published' && !canPublish(req)) {
          throw new APIError('Публиковать могут редактор и администратор. Сохраните черновик.', 403, undefined, true)
        }
        // путь страницы = путь родителя + символьный код
        // у черновика адрес может быть ещё не задан или занят — тогда он пустой, ошибка будет только при публикации
        const publishing = data._status === 'published'
        const slug = (data.slug ?? '').trim()
        const pid = parentId(data.parent ?? originalDoc?.parent)
        let parentPath = ''
        if (pid) {
          if (originalDoc && String(pid) === String(originalDoc.id)) {
            throw new APIError('Страница не может быть родителем самой себя', 400, undefined, true)
          }
          const parent = await req.payload.findByID({ collection: 'pages', id: pid, depth: 0, draft: true, req, overrideAccess: true })
          parentPath = (parent.path as string) ?? ''
          if (!slug) {
            if (publishing) throw new APIError('У вложенной страницы должен быть символьный код', 400, undefined, true)
            data.path = null
            data.content = nameBlocks(data.content)
            return data
          }
        }
        data.path = [parentPath, slug].filter(Boolean).join('/')
        data.content = nameBlocks(data.content)

        const where: Where = { path: { equals: data.path } }
        if (originalDoc?.id) where.id = { not_equals: originalDoc.id }
        const { totalDocs } = await req.payload.count({ collection: 'pages', where, req, overrideAccess: true })
        if (totalDocs > 0) {
          if (publishing) throw new APIError(`Адрес /${data.path}${data.path ? '/' : ''} уже занят другой страницей`, 400, undefined, true)
          data.path = null
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
    { name: 'tools', type: 'ui', admin: { position: 'sidebar', components: { Field: '/components/PageTools#PageTools' } } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Содержимое',
          fields: [
            {
              name: 'title',
              label: 'Название',
              type: 'text',
              required: true,
              localized: true,
              hooks: { beforeDuplicate: [({ value }) => (value ? `${value} (копия)` : value)] },
            },
            {
              name: 'content',
              label: 'Блоки',
              type: 'blocks',
              localized: true,
              blocks: [...pageBlocks, SharedBlockRef, PollBlock],
              labels: { singular: 'блок', plural: 'Блоки' },
              admin: { initCollapsed: true },
            },
          ],
        },
        {
          label: 'Настройки',
          fields: [
            {
              name: 'slug',
              label: 'Символьный код',
              type: 'text',
              index: true,
              admin: { description: 'Латиница, цифры и дефис. У главной страницы пусто.' },
              // у копии страницы — свой адрес
              hooks: { beforeDuplicate: [({ value }) => (value ? `${value}-copy` : value)] },
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
            {
              name: 'topics',
              label: 'Темы страницы',
              type: 'group',
              admin: { description: 'По ним блоки «Актуальное», «Похожие публикации» и «Связанные услуги» в автоматическом режиме подбирают близкие материалы' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'directions', label: 'Направления', type: 'relationship', relationTo: 'directions', hasMany: true, admin: { width: '50%' } },
                    { name: 'industries', label: 'Отрасли', type: 'relationship', relationTo: 'industries', hasMany: true, admin: { width: '50%' } },
                  ],
                },
              ],
            },
            {
              name: 'layout',
              label: 'Вид страницы',
              type: 'select',
              defaultValue: 'default',
              options: [
                { label: 'Обычная страница сайта', value: 'default' },
                { label: 'Лендинг: без меню в шапке и без футера', value: 'landing' },
              ],
              admin: { description: 'Лендинг — для рекламных кампаний: посетителя ничего не отвлекает от формы' },
            },
            {
              name: 'searchType',
              label: 'Раздел в поиске по сайту',
              type: 'select',
              defaultValue: 'auto',
              options: [
                { label: 'Определить по адресу', value: 'auto' },
                { label: 'Услуги', value: 'service' },
                { label: 'О компании', value: 'company' },
                { label: 'Отрасли', value: 'industry' },
                { label: 'Проекты', value: 'project' },
                { label: 'Карьера', value: 'career' },
                { label: 'Другое', value: 'other' },
                { label: 'Не показывать в поиске', value: 'hidden' },
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
