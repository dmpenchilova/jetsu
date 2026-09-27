/**
 * Опросы: вопрос с вариантами ответа, встраивается на страницу блоком «Опрос».
 * Один ответ с устройства; личные данные не собираются (только случайный номер устройства).
 */
import type { Block, CollectionConfig, Payload } from 'payload'

import { hasRole } from '../access'
import { dictAccess } from './shared'

export const Polls: CollectionConfig = {
  slug: 'polls',
  labels: { singular: 'Опрос', plural: 'Опросы' },
  admin: {
    useAsTitle: 'question',
    group: 'Контент',
    defaultColumns: ['question', 'active', 'until', 'updatedAt'],
    description: 'Вставляются на страницу блоком «Опрос». Один ответ с устройства, личные данные не собираются',
  },
  access: dictAccess,
  fields: [
    { name: 'question', label: 'Вопрос', type: 'text', required: true, localized: true },
    { name: 'description', label: 'Текст рядом с опросом', type: 'textarea', localized: true },
    {
      type: 'row',
      fields: [
        { name: 'multiple', label: 'Можно выбрать несколько ответов', type: 'checkbox', admin: { width: '40%' } },
        { name: 'active', label: 'Опрос идёт', type: 'checkbox', defaultValue: true, admin: { width: '25%' } },
        { name: 'until', label: 'До', type: 'date', admin: { width: '35%', description: 'Потом показываются только итоги' } },
      ],
    },
    {
      name: 'options',
      label: 'Ответы',
      type: 'array',
      minRows: 2,
      labels: { singular: 'ответ', plural: 'Ответы' },
      fields: [{ name: 'label', label: 'Ответ', type: 'text', required: true, localized: true }],
    },
    {
      name: 'showResults',
      label: 'Итоги посетителю',
      type: 'select',
      defaultValue: 'after',
      options: [
        { label: 'Показывать после ответа', value: 'after' },
        { label: 'Не показывать', value: 'never' },
      ],
    },
    { name: 'results', type: 'ui', admin: { position: 'sidebar', components: { Field: '/components/PollResults#PollResults' } } },
  ],
  endpoints: [
    {
      // итоги в CSV: /cms-api/polls/3/export
      path: '/:id/export',
      method: 'get',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Нужно войти в админку' }, { status: 401 })
        const id = Number(req.routeParams?.id)
        const results = await pollResults(req.payload, id, 'ru')
        const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
        const rows = [['Ответ', 'Голосов', 'Процент'].map(cell).join(';'), ...results.options.map((o) => [o.label, o.votes, `${o.percent}%`].map(cell).join(';'))]
        rows.push(['Всего ответивших', results.total, ''].map(cell).join(';'))
        return new Response(`﻿${rows.join('\r\n')}`, {
          headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="poll-${id}.csv"` },
        })
      },
    },
  ],
}

export const PollVotes: CollectionConfig = {
  slug: 'poll-votes',
  labels: { singular: 'Ответ на опрос', plural: 'Ответы на опросы' },
  admin: { hidden: true },
  access: { read: hasRole('admin'), create: () => false, update: () => false, delete: hasRole('admin') },
  fields: [
    { name: 'poll', type: 'relationship', relationTo: 'polls', index: true },
    { name: 'options', type: 'json' },
    { name: 'voter', type: 'text', index: true },
  ],
}

/** Блок конструктора «Опрос». */
export const PollBlock: Block = {
  slug: 'poll',
  labels: { singular: 'Опрос', plural: 'Опросы' },
  imageURL: '/blocks/poll.svg',
  imageAltText: 'Опрос',
  admin: { group: 'Прочее' },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'hidden', label: 'Скрыть блок', type: 'checkbox', admin: { width: '20%' } },
        { name: 'tag', label: 'Надзаголовок', type: 'text', admin: { width: '30%', placeholder: 'Опрос' } },
        { name: 'ref', label: 'Какой опрос', type: 'relationship', relationTo: 'polls', required: true, admin: { width: '50%' } },
      ],
    },
  ],
}

type PollDoc = { id: number; question?: string; description?: string; multiple?: boolean; active?: boolean; until?: string; showResults?: string; options?: { id?: string; label?: string }[] }

export const pollOpen = (p: PollDoc) => p.active !== false && (!p.until || new Date(p.until).getTime() > Date.now())

export const pollResults = async (payload: Payload, id: number, locale: 'ru' | 'en') => {
  const poll = (await payload.findByID({ collection: 'polls', id, locale, depth: 0, overrideAccess: true })) as PollDoc
  const votes = await payload.find({ collection: 'poll-votes', where: { poll: { equals: id } }, limit: 100_000, pagination: false, depth: 0, overrideAccess: true })
  const counts = new Map<string, number>()
  for (const v of votes.docs as unknown as { options?: string[] }[]) for (const o of v.options ?? []) counts.set(o, (counts.get(o) ?? 0) + 1)
  const total = votes.docs.length
  return {
    total,
    options: (poll.options ?? []).map((o) => {
      const n = counts.get(String(o.id)) ?? 0
      return { id: String(o.id), label: o.label ?? '', votes: n, percent: total ? Math.round((n / total) * 100) : 0 }
    }),
  }
}

/** Данные блока «Опрос» для сайта. */
export const pollToFront = async (payload: Payload, id: number, locale: 'ru' | 'en', tag?: string) => {
  const poll = (await payload.findByID({ collection: 'polls', id, locale, depth: 0, overrideAccess: true }).catch(() => null)) as PollDoc | null
  if (!poll?.question) return undefined
  return {
    id: poll.id,
    ...(tag ? { tag } : {}),
    question: poll.question,
    ...(poll.description ? { description: poll.description } : {}),
    multiple: !!poll.multiple,
    closed: !pollOpen(poll),
    showResults: poll.showResults !== 'never',
    options: (poll.options ?? []).map((o) => ({ id: String(o.id), label: o.label ?? '' })),
  }
}

const recent = new Map<string, number>()

/** Голос: POST /api/poll/vote { poll, options, voter } */
export const votePoll = async (payload: Payload, body: Record<string, unknown>, ipKey: string, locale: 'ru' | 'en') => {
  const id = Number(body.poll)
  const voter = typeof body.voter === 'string' ? body.voter.slice(0, 64) : ''
  const picked = Array.isArray(body.options) ? body.options.map(String).slice(0, 20) : []
  if (!id || !/^[a-z0-9-]{8,64}$/i.test(voter) || !picked.length) return { error: 'bad request' }
  const poll = (await payload.findByID({ collection: 'polls', id, locale, depth: 0, overrideAccess: true }).catch(() => null)) as PollDoc | null
  if (!poll) return { error: 'not found' }
  if (!pollOpen(poll)) return { error: 'closed', results: poll.showResults !== 'never' ? await pollResults(payload, id, locale) : undefined }
  const valid = new Set((poll.options ?? []).map((o) => String(o.id)))
  const options = [...new Set(picked)].filter((o) => valid.has(o))
  if (!options.length || (!poll.multiple && options.length > 1)) return { error: 'bad request' }
  // одно устройство — один ответ; с одного адреса — не чаще раза в 10 секунд
  const key = `${ipKey}:${id}`
  const now = Date.now()
  if ((recent.get(key) ?? 0) > now - 10_000) return { error: 'too many' }
  recent.set(key, now)
  if (recent.size > 10_000) for (const [k, t] of recent) if (t < now - 10_000) recent.delete(k)
  const exists = await payload.count({ collection: 'poll-votes', where: { and: [{ poll: { equals: id } }, { voter: { equals: voter } }] }, overrideAccess: true })
  if (!exists.totalDocs) await payload.create({ collection: 'poll-votes', data: { poll: id, options, voter }, overrideAccess: true })
  return { ok: true, results: poll.showResults !== 'never' ? await pollResults(payload, id, locale) : undefined }
}

