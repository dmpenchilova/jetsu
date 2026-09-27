/**
 * Перевод и согласование для страниц, публикаций, вакансий, проектов и мероприятий.
 *
 * Перевод: у записи есть статус английской версии — «нет», «устарела» (русскую правили позже) или «актуальна».
 * Согласование: автор отправляет черновик на проверку, редактор возвращает с комментарием или публикует.
 */
import type { CollectionConfig, Endpoint, Field, Payload, PayloadRequest } from 'payload'

import { canPublish } from '../access'

export const WORKFLOW_COLLECTIONS = new Set(['pages', 'publications', 'vacancies', 'projects', 'events'])

const LABEL: Record<string, string> = {
  pages: 'Страница',
  publications: 'Публикация',
  vacancies: 'Вакансия',
  projects: 'Проект',
  events: 'Мероприятие',
}

const fields: Field[] = [
  {
    name: 'translationStatus',
    label: 'EN',
    type: 'select',
    options: [
      { label: 'Нет перевода', value: 'none' },
      { label: 'Перевод устарел', value: 'outdated' },
      { label: 'Переведено', value: 'ok' },
    ],
    defaultValue: 'none',
    index: true,
    admin: { position: 'sidebar', readOnly: true, components: { Cell: '/components/Workflow#TranslationCell' }, condition: () => false },
  },
  { name: 'ruEditedAt', type: 'date', admin: { hidden: true } },
  { name: 'enEditedAt', type: 'date', admin: { hidden: true } },
  {
    name: 'reviewStatus',
    label: 'Согласование',
    type: 'select',
    options: [
      { label: '—', value: 'none' },
      { label: 'На проверке', value: 'review' },
      { label: 'Нужны правки', value: 'changes' },
      { label: 'Согласовано', value: 'approved' },
    ],
    defaultValue: 'none',
    index: true,
    admin: { position: 'sidebar', readOnly: true, components: { Cell: '/components/Workflow#ReviewCell' }, condition: () => false },
  },
  {
    name: 'reviewLog',
    type: 'array',
    admin: { hidden: true },
    fields: [
      { name: 'at', type: 'date' },
      { name: 'user', type: 'text' },
      { name: 'action', type: 'text' },
      { name: 'text', type: 'textarea' },
    ],
  },
  {
    name: 'workflow',
    type: 'ui',
    admin: { position: 'sidebar', components: { Field: '/components/Workflow#WorkflowPanel' } },
  },
]

const title = (v: unknown) => (typeof v === 'string' ? v.replace(/<[^>]+>/g, '').trim() : '')

/** Отметки времени правок по языкам и статус перевода. */
const stampHook = (slug: string) =>
  (async ({ data, req, originalDoc, context }) => {
    if ((context as { skipWorkflow?: boolean })?.skipWorkflow) return data
    const locale = req.locale === 'en' ? 'en' : 'ru'
    const now = new Date().toISOString()
    if (locale === 'ru') data.ruEditedAt = now
    else data.enEditedAt = now
    let hasEn = locale === 'en' ? !!title(data.title) : false
    if (locale === 'ru' && originalDoc?.id) {
      const en = await req.payload
        // без req: чтение с другим языком внутри запроса переключило бы язык сохраняемых данных
        .findByID({ collection: slug as 'pages', id: originalDoc.id, locale: 'en', depth: 0, draft: true, overrideAccess: true, select: { title: true } as never })
        .catch(() => null)
      hasEn = !!title((en as { title?: unknown } | null)?.title)
    }
    const ru = new Date(String(data.ruEditedAt ?? originalDoc?.ruEditedAt ?? 0)).getTime()
    const en = new Date(String(data.enEditedAt ?? originalDoc?.enEditedAt ?? 0)).getTime()
    data.translationStatus = !hasEn ? 'none' : ru > en + 60_000 ? 'outdated' : 'ok'
    // после публикации отметка «на проверке» снимается
    if (data._status === 'published' && (originalDoc?.reviewStatus === 'review' || originalDoc?.reviewStatus === 'approved')) data.reviewStatus = 'none'
    return data
  }) as NonNullable<NonNullable<CollectionConfig['hooks']>['beforeChange']>[number]

const editorsEmails = async (payload: Payload) => {
  const res = await payload.find({ collection: 'users', where: { role: { in: ['admin', 'editor'] } }, depth: 0, limit: 100, overrideAccess: true })
  return res.docs.map((u) => (u as { email?: string }).email).filter(Boolean) as string[]
}

const notify = async (payload: Payload, to: string[], subject: string, text: string) => {
  if (!process.env.SMTP_HOST || !to.length) return
  await payload.sendEmail({ to, subject, text }).catch((err: unknown) => payload.logger.error({ err }, 'review email'))
}

type Action = 'submit' | 'approve' | 'changes' | 'translated' | 'copyStructure'

/** POST /cms-api/<коллекция>/:id/workflow { action, text } */
const endpoint = (slug: string): Omit<Endpoint, 'root'> => ({
  path: '/:id/workflow',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const user = req.user as { email?: string; name?: string; role?: string } | null
    if (!user) return Response.json({ error: 'Нужно войти в админку' }, { status: 401 })
    const id = String(req.routeParams?.id ?? '')
    const body = (await req.json?.().catch(() => ({}))) as { action?: Action; text?: string }
    const doc = (await req.payload.findByID({ collection: slug as 'pages', id, depth: 0, draft: true, overrideAccess: true, locale: 'ru' }).catch(() => null)) as
      | (Record<string, unknown> & { reviewLog?: unknown[] })
      | null
    if (!doc) return Response.json({ error: 'not found' }, { status: 404 })
    const who = user.name || user.email || ''
    const log = [...((doc.reviewLog as unknown[]) ?? []), { at: new Date().toISOString(), user: who, action: body.action, text: (body.text ?? '').slice(0, 2000) }]
    const admin = (process.env.SERVER_URL ?? '').replace(/\/$/, '')
    const link = `${admin}/admin/collections/${slug}/${id}`
    const name = `${LABEL[slug] ?? slug} «${title(doc.title)}»`
    const save = (data: Record<string, unknown>, locale: 'ru' | 'en' = 'ru') =>
      req.payload.update({ collection: slug as 'pages', id, data, draft: true, overrideAccess: true, locale, context: { skipWorkflow: true }, depth: 0 })

    switch (body.action) {
      case 'submit':
        await save({ reviewStatus: 'review', reviewLog: log })
        await notify(req.payload, await editorsEmails(req.payload), `[jet.su] На проверку: ${name}`, `${who} отправил(а) на проверку ${name}.\n${body.text ? `\nКомментарий: ${body.text}\n` : ''}\nОткрыть: ${link}`)
        break
      case 'approve':
      case 'changes': {
        if (!canPublish(req)) return Response.json({ error: 'Согласовывают редактор и администратор' }, { status: 403 })
        await save({ reviewStatus: body.action === 'approve' ? 'approved' : 'changes', reviewLog: log })
        // автору — письмо с решением
        const author = [...((doc.reviewLog as { action?: string; user?: string }[]) ?? [])].reverse().find((l) => l.action === 'submit')?.user
        const authorUser = author
          ? (await req.payload.find({ collection: 'users', where: { or: [{ email: { equals: author } }, { name: { equals: author } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
          : null
        const to = (authorUser as { email?: string } | undefined)?.email
        if (to) {
          await notify(req.payload, [to], `[jet.su] ${body.action === 'approve' ? 'Согласовано' : 'Нужны правки'}: ${name}`, `${who}: ${body.action === 'approve' ? 'согласовано' : 'нужны правки'}.${body.text ? `\n\n${body.text}` : ''}\n\nОткрыть: ${link}`)
        }
        break
      }
      case 'translated':
        await save({ enEditedAt: new Date().toISOString(), translationStatus: 'ok', reviewLog: log })
        break
      case 'copyStructure': {
        // блоки русской версии → в английскую (тексты потом переводятся)
        if (slug !== 'pages') return Response.json({ error: 'Только для страниц' }, { status: 400 })
        const ru = (await req.payload.findByID({ collection: 'pages', id, locale: 'ru', depth: 0, draft: true, overrideAccess: true })) as { title?: string; content?: unknown[] }
        const { withoutIds } = await import('../collections/Library')
        const en = (await req.payload.findByID({ collection: 'pages', id, locale: 'en', depth: 0, draft: true, overrideAccess: true })) as { title?: string }
        await req.payload.update({
          collection: 'pages',
          id,
          locale: 'en',
          draft: true,
          overrideAccess: true,
          data: { title: en.title || ru.title, content: withoutIds(ru.content ?? []) as never },
        })
        break
      }
      default:
        return Response.json({ error: 'Неизвестное действие' }, { status: 400 })
    }
    return Response.json({ ok: true })
  },
})

/** Подключает перевод и согласование к коллекции. */
export const withWorkflow = <T extends CollectionConfig>(c: T): T => {
  if (!WORKFLOW_COLLECTIONS.has(c.slug)) return c
  const cols = c.admin?.defaultColumns ?? []
  return {
    ...c,
    admin: { ...c.admin, defaultColumns: [...cols.filter((x) => x !== 'updatedAt'), 'translationStatus', 'reviewStatus', ...(cols.includes('updatedAt') ? ['updatedAt'] : [])] },
    fields: [...c.fields, ...fields],
    hooks: { ...c.hooks, beforeChange: [...(c.hooks?.beforeChange ?? []), stampHook(c.slug)] },
    endpoints: [...(c.endpoints || []), endpoint(c.slug)] as CollectionConfig['endpoints'],
  } as T
}

/** Статус перевода для записей, созданных до появления этой функции (один раз, при запуске). */
export const backfillTranslation = async (payload: Payload) => {
  let fixed = 0
  for (const slug of WORKFLOW_COLLECTIONS) {
    const res = await payload.find({
      collection: slug as 'pages',
      // «нет перевода» у записей, у которых английская версия на самом деле есть
      where: { or: [{ translationStatus: { exists: false } }, { translationStatus: { equals: 'none' } }] },
      locale: 'en',
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: true,
      select: { title: true } as never,
    })
    for (const doc of res.docs as unknown as { id: number; title?: string }[]) {
      if (!title(doc.title)) continue
      const status = 'ok'
      await payload.db.updateOne({ collection: slug as 'pages', id: doc.id, data: { translationStatus: status } }).catch(() => undefined)
      fixed += 1
    }
  }
  if (fixed) payload.logger.info(`Статус перевода проставлен: ${fixed}`)
}
