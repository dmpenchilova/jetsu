/**
 * Защита приёма заявок: ограничение частоты с одного адреса и проверка Яндекс SmartCaptcha.
 */
import { createHash } from 'node:crypto'

/** Адрес посетителя: сайт проксирует запрос, исходный адрес приходит в X-Forwarded-For. */
export const clientIp = (req: Request) => {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/** Сам адрес не храним — только отпечаток, чтобы находить повторы. */
export const ipHash = (ip: string) =>
  createHash('sha256')
    .update(`${process.env.PAYLOAD_SECRET ?? ''}:${ip}`)
    .digest('hex')
    .slice(0, 16)

const hits = new Map<string, number[]>()

/**
 * Скользящее окно в памяти процесса. Считаются только принятые заявки (recordHit),
 * чтобы человек, исправляющий ошибки в форме, не упёрся в лимит.
 */
export const rateLimited = (key: string, perMinute: number, perHour: number) => {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter((t) => now - t < 3600_000)
  hits.set(key, list)
  return list.filter((t) => now - t < 60_000).length >= perMinute || list.length >= perHour
}

export const recordHit = (key: string) => {
  const now = Date.now()
  hits.set(key, [...(hits.get(key) ?? []), now])
  // не даём таблице расти бесконечно
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < 3600_000)) hits.delete(k)
  }
}

export type CaptchaResult = 'ok' | 'failed' | 'off' | 'unavailable'

/**
 * Проверка токена SmartCaptcha. Ключ сервера — SMARTCAPTCHA_SERVER_KEY в .env.
 * Без ключа капча выключена. Если сервис капчи недоступен, заявку принимаем
 * (так рекомендует Яндекс), но помечаем.
 */
export const checkCaptcha = async (token: string | undefined, ip: string): Promise<CaptchaResult> => {
  const secret = process.env.SMARTCAPTCHA_SERVER_KEY
  if (!secret) return 'off'
  if (!token) return 'failed'
  try {
    const body = new URLSearchParams({ secret, token, ip })
    const res = await fetch('https://smartcaptcha.yandexcloud.net/validate', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return 'unavailable'
    const data = (await res.json()) as { status?: string }
    return data.status === 'ok' ? 'ok' : 'failed'
  } catch {
    return 'unavailable'
  }
}
