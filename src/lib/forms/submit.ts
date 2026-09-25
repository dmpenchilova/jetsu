/**
 * Приём заявки с сайта: POST /api/form/callback/?form=<id>
 * Фронт присылает multipart/form-data (XHR) или JSON (серверное действие).
 */
import type { Payload } from 'payload'

import type { FormKind } from '../../collections/Submissions'
import type { FormSettingsDoc } from '../../globals/formSettings'
import { checkCaptcha, clientIp, ipHash, rateLimited, recordHit } from './guard'
import { queueDeliveries } from './deliver'
import { cleanText, type FormFieldDef, type IncomingFile, validateSubmission } from './validate'

type FormDocFull = {
  id: number
  title?: string | null
  kind?: FormKind | null
  visible?: FormFieldDef[] | null
  hidden?: FormFieldDef[] | null
}

const SERVICE_KEYS = new Set(['page', 'serviceInfo', 'smart-token', 'lang', 'form'])
const MAX_BODY = 60 * 1024 * 1024

const reply = (status: number, success: boolean, extra: Record<string, unknown> = {}) =>
  Response.json(
    { status: success ? 'success' : 'error', data: { success, ...extra } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )

/** Разбор тела запроса в строки и файлы. */
const readBody = async (req: Request) => {
  const values: Record<string, string> = {}
  const files: Record<string, IncomingFile[]> = {}
  const type = req.headers.get('content-type') ?? ''
  if (type.includes('multipart/form-data') || type.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData()
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') {
        values[key] = values[key] ? `${values[key]}, ${value}` : value
      } else {
        const data = Buffer.from(await value.arrayBuffer())
        ;(files[key] ??= []).push({ name: value.name, type: value.type, size: data.length, data })
      }
    }
  } else {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    for (const [key, value] of Object.entries(body)) {
      if (value === null || value === undefined) continue
      values[key] = typeof value === 'object' ? JSON.stringify(value) : String(value)
    }
  }
  return { values, files }
}

/** UTM-метки: фронт кладёт их в serviceInfo (JSON). */
const readUtm = (raw: string | undefined) => {
  if (!raw) return undefined
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (/^utm_[a-z_]{1,30}$/.test(k) && typeof v === 'string') out[k] = cleanText(v).slice(0, 200)
    }
    return Object.keys(out).length ? out : undefined
  } catch {
    return undefined
  }
}

/** Страница, с которой пришла заявка: только адрес без лишнего. */
const readPage = (raw: string | undefined) => {
  if (!raw) return ''
  try {
    const u = new URL(raw)
    if (!/^https?:$/.test(u.protocol)) return ''
    return `${u.origin}${u.pathname}${u.search}`.slice(0, 500)
  } catch {
    return ''
  }
}

export const handleFormSubmit = async (payload: Payload, req: Request) => {
  const url = new URL(req.url)
  const size = Number(req.headers.get('content-length') ?? 0)
  if (size > MAX_BODY) return reply(413, false, { message: 'Слишком большой запрос' })

  const formId = Number(url.searchParams.get('form'))
  const { values, files } = await readBody(req)
  const id = formId || Number(values.form)
  if (!id) return reply(400, false, { message: 'Не указана форма' })

  const form = (await payload
    .findByID({ collection: 'forms', id, depth: 0, locale: 'all' as 'ru', overrideAccess: true })
    .catch(() => null)) as unknown as (Omit<FormDocFull, 'title' | 'visible' | 'hidden'> & {
    title?: Record<string, string>
    visible?: Record<string, FormFieldDef[]>
    hidden?: Record<string, FormFieldDef[]>
  }) | null
  if (!form) return reply(404, false, { message: 'Форма не найдена' })

  const page = readPage(values.page)
  const locale = values.lang === 'en' || /\/en(\/|$)/.test(page ? new URL(page).pathname : '') ? 'en' : 'ru'
  const en = locale === 'en'

  const settings = (await payload.findGlobal({ slug: 'form-settings', depth: 0, overrideAccess: true })) as FormSettingsDoc

  // частота
  const ip = clientIp(req)
  const hash = ipHash(ip)
  if (rateLimited(hash, settings.rateLimit?.perMinute ?? 3, settings.rateLimit?.perHour ?? 20)) {
    return reply(429, false, { message: en ? 'Too many requests, try again later' : 'Слишком много заявок, попробуйте позже' })
  }

  // капча
  const captcha = await checkCaptcha(values['smart-token'], ip)
  if (captcha === 'failed') return reply(400, false, { message: en ? 'Captcha check failed' : 'Не пройдена проверка капчи' })

  // поля формы на языке страницы
  const defs = [...(form.visible?.[locale] ?? form.visible?.ru ?? []), ...(form.hidden?.[locale] ?? form.hidden?.ru ?? [])]
  const result = validateSubmission(
    defs,
    Object.fromEntries(Object.entries(values).filter(([k]) => !SERVICE_KEYS.has(k))),
    files,
    { maxFileBytes: (settings.maxFileMb ?? 10) * 1024 * 1024, en },
  )
  if (!result.ok) return reply(400, false, { message: en ? 'Check the form fields' : 'Проверьте поля формы', errors: result.errors })
  if (!result.fields.length) return reply(400, false, { message: en ? 'Empty form' : 'Форма пустая' })

  // файлы — в закрытое хранилище
  const fileIds: number[] = []
  for (const { file } of result.files) {
    const safeName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(-120)
    const doc = await payload.create({
      collection: 'submission-files',
      data: {},
      file: { data: file.data, mimetype: file.type || 'application/octet-stream', name: safeName, size: file.size },
      overrideAccess: true,
    })
    fileIds.push(doc.id as number)
  }

  const kind = (form.kind ?? 'business') as FormKind
  const formTitle = form.title?.ru ?? form.title?.[locale] ?? `Форма ${form.id}`
  const pick = (re: RegExp) => result.fields.find((f) => re.test(f.name))?.value
  const who = [pick(/^(name|fio|first_?name|имя)$/i), pick(/^(surname|last_?name|фамилия)$/i)].filter(Boolean).join(' ')
  const contact = pick(/mail/i) ?? pick(/phone|tel/i) ?? ''
  const KIND: Record<string, string> = { business: 'бизнес-запрос', vacancy: 'отклик на вакансию', quality: 'качество поддержки', incident: 'инцидент' }
  const company = pick(/^(company|компания)$/i)
  const summary = [who || contact || 'Без имени', company, KIND[kind]].filter(Boolean).join(' · ').slice(0, 200)

  const submission = await payload.create({
    collection: 'submissions',
    data: {
      summary,
      kind,
      status: 'new',
      deliveryState: 'pending',
      fields: result.fields,
      files: fileIds,
      form: form.id,
      formTitle,
      page,
      locale,
      utm: readUtm(values.serviceInfo),
      captcha: { ok: 'пройдена', off: 'выключена', unavailable: 'сервис недоступен', failed: 'не пройдена' }[captcha],
      ipHash: hash,
      search: result.fields.map((f) => f.value).join(' ').slice(0, 2000),
      data: Object.fromEntries(result.fields.map((f) => [f.name, f.value])),
    },
    overrideAccess: true,
  })

  recordHit(hash)
  await queueDeliveries(payload, submission.id as number)

  return reply(200, true)
}
