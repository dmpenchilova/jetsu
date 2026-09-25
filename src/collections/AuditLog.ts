/**
 * Журнал действий: кто, когда и что сделал в админке. Записи нельзя изменить или удалить из интерфейса.
 * Пишется автоматически для всех разделов; вход и выход — тоже. Хранится 3 года.
 */
import type { CollectionConfig, GlobalConfig, PayloadRequest } from 'payload'

import { hasRole } from '../access'

export const AUDIT_ACTIONS = [
  { label: 'Создание', value: 'create' },
  { label: 'Изменение', value: 'update' },
  { label: 'Публикация', value: 'publish' },
  { label: 'Снятие с публикации', value: 'unpublish' },
  { label: 'Удаление', value: 'delete' },
  { label: 'Вход', value: 'login' },
  { label: 'Выход', value: 'logout' },
  { label: 'Настройки', value: 'settings' },
] as const

export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: { singular: 'Запись журнала', plural: 'Журнал действий' },
  admin: {
    useAsTitle: 'summary',
    group: 'Сервис',
    defaultColumns: ['createdAt', 'userEmail', 'action', 'summary', 'ip'],
    listSearchableFields: ['summary', 'userEmail', 'target'],
    description: 'Записи нельзя изменить или удалить. Хранятся 3 года. Выгрузка в CSV — кнопкой вверху страницы',
    pagination: { defaultLimit: 50 },
    components: { beforeListTable: ['/components/AuditExport#AuditExport'] },
  },
  defaultSort: '-createdAt',
  access: { read: hasRole('admin'), create: () => false, update: () => false, delete: () => false },
  endpoints: [
    {
      // выгрузка в CSV: /cms-api/audit-log/export?days=30
      path: '/export',
      method: 'get',
      handler: async (req) => {
        if ((req.user as { role?: string } | null)?.role !== 'admin') return Response.json({ error: 'forbidden' }, { status: 403 })
        const days = Math.min(1100, Math.max(1, Number(new URL(req.url ?? '', 'http://x').searchParams.get('days')) || 30))
        const since = new Date(Date.now() - days * 86400_000).toISOString()
        const res = await req.payload.find({ collection: 'audit-log', where: { createdAt: { greater_than: since } }, sort: '-createdAt', limit: 50_000, pagination: false, depth: 0, overrideAccess: true })
        const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
        const label = Object.fromEntries(AUDIT_ACTIONS.map((a) => [a.value, a.label]))
        const rows = [
          ['Когда (МСК)', 'Кто', 'Действие', 'Объект', 'Раздел и номер', 'Что изменилось', 'IP'].map(cell).join(';'),
          ...res.docs.map((d) =>
            [
              new Date(d.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
              d.userEmail,
              label[d.action as string] ?? d.action,
              d.summary,
              d.target,
              d.changes,
              d.ip,
            ]
              .map(cell)
              .join(';'),
          ),
        ]
        // BOM — чтобы Excel открыл кириллицу правильно
        return new Response(`\ufeff${rows.join('\r\n')}`, {
          headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="jet-audit-${days}d.csv"` },
        })
      },
    },
  ],
  fields: [
    { name: 'summary', label: 'Объект', type: 'text', admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'action', label: 'Действие', type: 'select', options: [...AUDIT_ACTIONS], index: true, admin: { readOnly: true, width: '25%' } },
        { name: 'userEmail', label: 'Кто', type: 'text', index: true, admin: { readOnly: true, width: '35%' } },
        { name: 'ip', label: 'IP', type: 'text', admin: { readOnly: true, width: '20%' } },
        { name: 'locale', label: 'Язык', type: 'text', admin: { readOnly: true, width: '20%' } },
      ],
    },
    { name: 'target', label: 'Раздел и номер', type: 'text', index: true, admin: { readOnly: true } },
    { name: 'changes', label: 'Что изменилось', type: 'textarea', admin: { readOnly: true } },
    { name: 'user', type: 'relationship', relationTo: 'users', admin: { hidden: true } },
  ],
  timestamps: true,
}

const ipOf = (req: PayloadRequest) =>
  req.headers?.get('x-forwarded-for')?.split(',')[0].trim() || req.headers?.get('x-real-ip') || ''

/** Заголовок документа для журнала. */
const titleOf = (doc: Record<string, unknown> | undefined) => {
  const t = doc?.title ?? doc?.summary ?? doc?.filename ?? doc?.email ?? doc?.from ?? doc?.name
  return typeof t === 'string' ? t.replace(/<[^>]+>/g, '').slice(0, 150) : ''
}

const SKIP_DIFF = new Set(['updatedAt', 'createdAt', '_status', 'id', 'hash', 'salt', 'password', 'sessions', 'resetPasswordToken', 'loginAttempts', 'lockUntil'])

/** Какие поля верхнего уровня изменились (без значений: в журнал не пишем содержимое и персональные данные). */
const changedFields = (doc: Record<string, unknown>, prev: Record<string, unknown> | undefined) => {
  if (!prev) return ''
  const keys = new Set([...Object.keys(doc), ...Object.keys(prev)])
  const out: string[] = []
  for (const k of keys) {
    if (SKIP_DIFF.has(k)) continue
    if (JSON.stringify(doc[k] ?? null) !== JSON.stringify(prev[k] ?? null)) out.push(k)
  }
  return out.slice(0, 30).join(', ')
}

type WriteArgs = { req: PayloadRequest; action: string; target: string; summary: string; changes?: string }

export const writeAudit = async ({ req, action, target, summary, changes }: WriteArgs) => {
  // действия самой системы (импорт, очередь) не пишем — только людей
  if (!req.user) return
  const user = req.user as { id: number; email?: string }
  try {
    await req.payload.create({
      collection: 'audit-log',
      data: { action: action as 'create', target, summary, changes, user: user.id, userEmail: user.email ?? '', ip: ipOf(req), locale: req.locale ?? '' },
      overrideAccess: true,
      req,
    })
  } catch (err) {
    req.payload.logger.error({ err }, 'audit log')
  }
}

/** Разделы, которые не пишем: сам журнал, служебные и технические. */
const SKIP = new Set(['audit-log', 'search-index', 'search-queries', 'payload-jobs', 'payload-locked-documents', 'payload-preferences', 'payload-migrations', 'submission-files'])

export const withAudit = <T extends CollectionConfig>(c: T): T => {
  if (SKIP.has(c.slug)) return c
  const label = typeof c.labels?.singular === 'string' ? c.labels.singular : c.slug
  const hooks = { ...(c.hooks ?? {}) }
  hooks.afterChange = [
    ...(hooks.afterChange ?? []),
    async ({ doc, previousDoc, operation, req }) => {
      const autosave = String((req.query as Record<string, unknown> | undefined)?.autosave ?? '') === 'true'
      if (autosave) return doc
      const status = (doc as { _status?: string })._status
      const prevStatus = (previousDoc as { _status?: string } | undefined)?._status
      const draftSave = String((req.query as Record<string, unknown> | undefined)?.draft ?? '') === 'true'
      let action = operation === 'create' ? 'create' : 'update'
      if (status === 'published') action = 'publish'
      else if (status === 'draft' && prevStatus === 'published' && !draftSave && operation === 'update') action = 'unpublish'
      const changes = operation === 'update' ? changedFields(doc, previousDoc) : ''
      // служебные обновления без видимых правок (например, счётчик входов) не пишем
      if (action === 'update' && !changes) return doc
      await writeAudit({ req, action, target: `${label} № ${doc.id}`, summary: `${label}: ${titleOf(doc)}`, changes })
      return doc
    },
  ]
  hooks.afterDelete = [
    ...(hooks.afterDelete ?? []),
    async ({ doc, req }) => {
      await writeAudit({ req, action: 'delete', target: `${label} № ${doc.id}`, summary: `${label}: ${titleOf(doc)}` })
    },
  ]
  if (c.auth) {
    hooks.afterLogin = [
      ...(hooks.afterLogin ?? []),
      async ({ req, user }) => {
        await writeAudit({ req: { ...req, user } as PayloadRequest, action: 'login', target: `Пользователь № ${user.id}`, summary: `Вход: ${user.email}` })
      },
    ]
    hooks.afterLogout = [
      ...(hooks.afterLogout ?? []),
      async ({ req }) => {
        await writeAudit({ req, action: 'logout', target: '', summary: `Выход: ${(req.user as { email?: string } | null)?.email ?? ''}` })
      },
    ]
  }
  return { ...c, hooks }
}

export const withAuditGlobal = <T extends GlobalConfig>(g: T): T => {
  const label = typeof g.label === 'string' ? g.label : g.slug
  return {
    ...g,
    hooks: {
      ...(g.hooks ?? {}),
      afterChange: [
        ...(g.hooks?.afterChange ?? []),
        async ({ doc, previousDoc, req }) => {
          await writeAudit({ req, action: 'settings', target: label, summary: `Настройки: ${label}`, changes: changedFields(doc, previousDoc) })
          return doc
        },
      ],
    },
  }
}
