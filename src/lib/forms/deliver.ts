/**
 * Очередь отправки заявок: письмо получателям, позже — Битрикс24 и FriendWork.
 * Каждая отправка — отдельная задача очереди Payload с повторами при ошибке.
 * Ход отправки пишется в «Журнал отправки» заявки.
 */
import type { Payload, TaskConfig } from 'payload'

import type { FormSettingsDoc } from '../../globals/formSettings'
import { submissionEmail } from './email'

export const FORMS_QUEUE = 'forms'
const MAX_ATTEMPTS = 5

type Channel = 'email' | 'bitrix24' | 'friendwork'

type Delivery = {
  id?: string
  channel: Channel
  status: 'pending' | 'sent' | 'retry' | 'failed' | 'skipped'
  attempts?: number | null
  at?: string | null
  target?: string | null
  error?: string | null
}

export type SubmissionDoc = {
  id: number
  summary?: string | null
  kind?: string | null
  fields?: { name?: string | null; label?: string | null; value?: string | null }[] | null
  files?: (number | { id: number; filename?: string | null; mimeType?: string | null; url?: string | null })[] | null
  form?: number | { id: number } | null
  formTitle?: string | null
  page?: string | null
  locale?: string | null
  utm?: Record<string, string> | null
  deliveries?: Delivery[] | null
  createdAt?: string
}

const stateOf = (list: Delivery[]) => {
  if (list.some((d) => d.status === 'failed')) return 'failed'
  if (list.every((d) => d.status === 'sent' || d.status === 'skipped')) return 'sent'
  return 'pending'
}

const saveDelivery = async (payload: Payload, submission: SubmissionDoc, patch: Delivery) => {
  const list = (submission.deliveries ?? []).map((d) => ({ ...d }))
  const i = list.findIndex((d) => d.channel === patch.channel)
  if (i >= 0) list[i] = { ...list[i], ...patch }
  else list.push(patch)
  await payload.update({
    collection: 'submissions',
    id: submission.id,
    data: { deliveries: list, deliveryState: stateOf(list) },
    overrideAccess: true,
    depth: 0,
  })
}

export const smtpConfigured = () => !!process.env.SMTP_HOST

/** Кому письмо: общие получатели по типу + ящик центра + получатели формы. */
export const recipientsOf = async (payload: Payload, submission: SubmissionDoc) => {
  const settings = (await payload.findGlobal({ slug: 'form-settings', depth: 0, overrideAccess: true })) as FormSettingsDoc
  const formId = typeof submission.form === 'object' ? submission.form?.id : submission.form
  const form = formId
    ? ((await payload.findByID({ collection: 'forms', id: formId, depth: 1, overrideAccess: true }).catch(() => null)) as {
        recipients?: string[] | null
        cc?: string[] | null
        center?: { email?: string | null } | number | null
      } | null)
    : null
  const kind = (submission.kind ?? 'business') as keyof NonNullable<FormSettingsDoc['recipients']>
  const to = new Set<string>([...(settings.recipients?.[kind] ?? []), ...(form?.recipients ?? [])])
  const center = form?.center && typeof form.center === 'object' ? form.center.email : null
  if (center) to.add(center)
  const cc = new Set<string>([...(settings.copy ?? []), ...(form?.cc ?? [])].filter((e) => !to.has(e)))
  return { to: [...to], cc: [...cc], settings }
}

/** Ставит отправки заявки в очередь и сразу запускает очередь, не дожидаясь расписания. */
export const queueDeliveries = async (payload: Payload, submissionId: number) => {
  const submission = (await payload.findByID({ collection: 'submissions', id: submissionId, depth: 0, overrideAccess: true })) as SubmissionDoc
  const settings = (await payload.findGlobal({ slug: 'form-settings', depth: 0, overrideAccess: true })) as FormSettingsDoc

  const channels: Channel[] = ['email']
  if (settings.bitrix24?.enabled && (settings.bitrix24.kinds ?? []).includes(submission.kind ?? '')) channels.push('bitrix24')
  if (settings.friendwork?.enabled && submission.kind === 'vacancy') channels.push('friendwork')

  const list: Delivery[] = channels.map((channel) => ({ channel, status: 'pending', attempts: 0 }))
  await payload.update({
    collection: 'submissions',
    id: submissionId,
    data: { deliveries: list, deliveryState: 'pending' },
    overrideAccess: true,
    depth: 0,
  })
  for (const channel of channels) {
    await payload.jobs.queue({ task: `deliver-${channel}` as 'deliver-email', input: { submission: submissionId }, queue: FORMS_QUEUE })
  }
  // отправляем сразу; повторы после ошибок подхватит расписание очереди
  void payload.jobs.run({ queue: FORMS_QUEUE, limit: 10 }).catch((err) => payload.logger.error({ err }, 'forms queue'))
}

/** Общая обёртка задачи: считает попытки, пишет журнал, решает — повторять или сдаваться. */
const runDelivery =
  (channel: Channel, send: (payload: Payload, s: SubmissionDoc) => Promise<{ target?: string; skipped?: string }>) =>
  async ({ input, req }: { input: { submission: number }; req: { payload: Payload } }) => {
    const payload = req.payload
    const submission = (await payload
      .findByID({ collection: 'submissions', id: input.submission, depth: 1, overrideAccess: true })
      .catch(() => null)) as SubmissionDoc | null
    // заявку удалили — отправлять нечего
    if (!submission) return { output: {} }
    const prev = submission.deliveries?.find((d) => d.channel === channel)
    const attempts = (prev?.attempts ?? 0) + 1
    try {
      const res = await send(payload, submission)
      await saveDelivery(payload, submission, {
        channel,
        status: res.skipped ? 'skipped' : 'sent',
        attempts,
        at: new Date().toISOString(),
        target: res.target ?? null,
        error: res.skipped ?? null,
      })
      return { output: {} }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await saveDelivery(payload, submission, {
        channel,
        status: attempts >= MAX_ATTEMPTS ? 'failed' : 'retry',
        attempts,
        at: new Date().toISOString(),
        error: message.slice(0, 500),
      })
      if (attempts >= MAX_ATTEMPTS) return { output: {} }
      throw err
    }
  }

const sendEmail = async (payload: Payload, submission: SubmissionDoc) => {
  const { to, cc, settings } = await recipientsOf(payload, submission)
  if (!to.length) return { skipped: 'Не заданы получатели — укажите их в «Настройках форм»' }
  if (!smtpConfigured()) return { target: to.join(', '), skipped: 'Почтовый сервер не настроен (SMTP_HOST в .env)' }
  const mail = await submissionEmail(payload, submission, settings)
  await payload.sendEmail({ to, cc: cc.length ? cc : undefined, ...mail })
  await payload.update({ collection: 'submissions', id: submission.id, data: { recipients: [...to, ...cc].join(', ') }, overrideAccess: true, depth: 0 })
  return { target: to.join(', ') }
}

// Интеграции подключаются на последнем этапе
const notYet = (name: string) => async () => ({ skipped: `${name}: интеграция ещё не подключена` })

const retries = { attempts: MAX_ATTEMPTS, backoff: { type: 'exponential' as const, delay: 60_000 } }

export const formTasks: TaskConfig[] = [
  {
    slug: 'deliver-email',
    label: 'Письмо по заявке',
    inputSchema: [{ name: 'submission', type: 'number', required: true }],
    retries,
    handler: runDelivery('email', sendEmail) as unknown as TaskConfig['handler'],
  },
  {
    slug: 'deliver-bitrix24',
    label: 'Заявка в Битрикс24',
    inputSchema: [{ name: 'submission', type: 'number', required: true }],
    retries,
    handler: runDelivery('bitrix24', notYet('Битрикс24')) as unknown as TaskConfig['handler'],
  },
  {
    slug: 'deliver-friendwork',
    label: 'Отклик в FriendWork',
    inputSchema: [{ name: 'submission', type: 'number', required: true }],
    retries,
    handler: runDelivery('friendwork', notYet('FriendWork')) as unknown as TaskConfig['handler'],
  },
  {
    slug: 'cleanup-submissions',
    label: 'Удаление старых заявок',
    schedule: [{ cron: '0 3 * * *', queue: FORMS_QUEUE }],
    handler: (async ({ req }: { req: { payload: Payload } }) => {
      const payload = req.payload
      const settings = (await payload.findGlobal({ slug: 'form-settings', depth: 0, overrideAccess: true })) as FormSettingsDoc
      const days = settings.retentionDays ?? 90
      const before = new Date(Date.now() - days * 86400_000).toISOString()
      // по одной, чтобы сработали хуки удаления файлов
      const old = await payload.find({ collection: 'submissions', where: { createdAt: { less_than: before } }, limit: 500, depth: 0, overrideAccess: true })
      for (const doc of old.docs) await payload.delete({ collection: 'submissions', id: doc.id, overrideAccess: true })
      return { output: { deleted: old.docs.length } }
    }) as unknown as TaskConfig['handler'],
  },
]
