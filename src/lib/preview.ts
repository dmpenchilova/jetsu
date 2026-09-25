/**
 * Ссылки предпросмотра черновиков. Фронт открывает /preview?hash=…, отправляет hash в POST /api/preview,
 * а админка по подписи понимает, какой черновик отдать. Базы для этого не нужно; ссылка живёт около суток.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const WINDOW = 12 * 60 * 60 * 1000 // ссылка одна и та же в течение 12 часов, чтобы превью не перезагружалось зря

const sign = (body: string) =>
  createHmac('sha256', `${process.env.PAYLOAD_SECRET ?? ''}:preview`).update(body).digest('hex').slice(0, 40)

export type PreviewTarget = { id: string; locale: 'ru' | 'en'; block?: string }

export const makePreviewHash = ({ id, locale, block }: PreviewTarget) => {
  const expires = (Math.floor(Date.now() / WINDOW) + 2) * WINDOW
  const body = ['p', id, locale, block ?? '', expires.toString(36)].join('.')
  return `${body}.${sign(body)}`
}

export const readPreviewHash = (hash: string): PreviewTarget | null => {
  const parts = hash.split('.')
  if (parts.length !== 6 || parts[0] !== 'p') return null
  const body = parts.slice(0, 5).join('.')
  const expected = Buffer.from(sign(body))
  const got = Buffer.from(parts[5])
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null
  if (parseInt(parts[4], 36) < Date.now()) return null
  const [, id, locale, block] = parts
  if (!/^\d+$/.test(id) || (locale !== 'ru' && locale !== 'en')) return null
  return { id, locale, block: block || undefined }
}

export const previewUrl = (target: PreviewTarget) => {
  const front = (process.env.FRONT_URL ?? '').replace(/\/$/, '')
  if (!front) return null
  const prefix = target.locale === 'en' ? '/en' : ''
  return `${front}${prefix}/preview?hash=${encodeURIComponent(makePreviewHash(target))}`
}
