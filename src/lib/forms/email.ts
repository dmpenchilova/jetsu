/**
 * Письмо о новой заявке: тема, таблица полей, источник, ссылка в админку, файлы во вложениях.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

import type { FormSettingsDoc } from '../../globals/formSettings'
import type { SubmissionDoc } from './deliver'

const KIND_LABEL: Record<string, string> = {
  business: 'Бизнес-запрос',
  vacancy: 'Отклик на вакансию',
  quality: 'Качество сервисной поддержки',
  incident: 'Сообщить об инциденте',
}

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const row = (label: string, value: string) =>
  `<tr><td style="padding:8px 16px 8px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:8px 0;color:#111827;white-space:pre-wrap">${value}</td></tr>`

/** Не больше 20 МБ вложений на письмо; остальное — по ссылке из админки. */
const MAX_ATTACH = 20 * 1024 * 1024

export const submissionEmail = async (payload: Payload, s: SubmissionDoc, settings: FormSettingsDoc) => {
  const kind = KIND_LABEL[s.kind ?? ''] ?? 'Заявка'
  const who = s.summary?.split(' · ')[0] ?? ''
  const subject = [settings.subjectPrefix ?? '[jet.su]', kind, who && `— ${who}`].filter(Boolean).join(' ')
  const admin = (process.env.SERVER_URL ?? '').replace(/\/$/, '')
  const link = `${admin}/admin/collections/submissions/${s.id}`
  const date = new Date(s.createdAt ?? Date.now()).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })

  const fields = (s.fields ?? []).map((f) => row(f.label ?? f.name ?? '', esc(f.value))).join('')
  const utm = s.utm ? Object.entries(s.utm).map(([k, v]) => `${k}=${v}`).join(', ') : ''
  const meta = [
    row('Форма', esc(s.formTitle)),
    row('Тип', esc(kind)),
    s.page ? row('Страница', `<a href="${esc(s.page)}">${esc(s.page)}</a>`) : '',
    row('Язык', s.locale === 'en' ? 'английский' : 'русский'),
    utm ? row('UTM', esc(utm)) : '',
    row('Дата', `${esc(date)} (МСК)`),
  ].join('')

  const attachments: { filename: string; content: Buffer; contentType?: string }[] = []
  let total = 0
  const staticDir = process.env.PRIVATE_UPLOADS_DIR || path.resolve(process.cwd(), 'private-uploads')
  for (const f of s.files ?? []) {
    if (!f || typeof f !== 'object' || !f.filename) continue
    const content = await readFile(path.join(staticDir, f.filename)).catch(() => null)
    if (!content || total + content.length > MAX_ATTACH) continue
    total += content.length
    attachments.push({ filename: f.filename, content, contentType: f.mimeType ?? undefined })
  }

  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;font-size:14px">
<div style="max-width:640px;margin:0 auto;padding:24px">
  <div style="background:#0032AD;color:#fff;border-radius:16px 16px 0 0;padding:20px 24px;font-size:18px;font-weight:bold">${esc(kind)}</div>
  <div style="background:#fff;border-radius:0 0 16px 16px;padding:16px 24px 24px">
    <table style="border-collapse:collapse;width:100%">${fields}</table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
    <table style="border-collapse:collapse;width:100%;font-size:13px">${meta}</table>
    ${attachments.length ? `<p style="color:#6b7280;font-size:13px">Файлы во вложении: ${attachments.map((a) => esc(a.filename)).join(', ')}</p>` : ''}
    <p style="margin:24px 0 0"><a href="${esc(link)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:10px 20px">Открыть в админке</a></p>
  </div>
</div></body></html>`

  const text = [
    kind,
    '',
    ...(s.fields ?? []).map((f) => `${f.label ?? f.name}: ${f.value ?? ''}`),
    '',
    `Форма: ${s.formTitle ?? ''}`,
    s.page ? `Страница: ${s.page}` : '',
    utm ? `UTM: ${utm}` : '',
    `Дата: ${date} (МСК)`,
    `Заявка в админке: ${link}`,
  ]
    .filter((l) => l !== undefined)
    .join('\n')

  const from = process.env.SMTP_FROM ?? 'noreply@jet.su'
  // «Ответить» в почте — сразу автору заявки
  const replyTo = (s.fields ?? []).find((f) => /mail/i.test(f.name ?? '') && /^[^\s@]+@[^\s@]+$/.test(f.value ?? ''))?.value ?? undefined
  return { subject, html, text, attachments, replyTo, from: `"${settings.fromName ?? 'Сайт jet.su'}" <${from}>` }
}
