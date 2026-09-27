/**
 * Оповещения о сбоях: в Telegram и/или на почту.
 *
 *   ALERT_TELEGRAM_BOT_TOKEN + ALERT_TELEGRAM_CHAT_ID — бот пишет в чат (или канал) дежурных
 *   ALERT_EMAIL — адреса через запятую (письмо уходит через тот же SMTP, что и заявки)
 *
 * Одинаковые оповещения не повторяются чаще раза в 30 минут, чтобы не засыпать чат.
 */
import type { Payload } from 'payload'

const QUIET_MS = 30 * 60_000
const sentAt = new Map<string, number>()

export const alertsConfigured = () =>
  !!(process.env.ALERT_TELEGRAM_BOT_TOKEN && process.env.ALERT_TELEGRAM_CHAT_ID) || !!process.env.ALERT_EMAIL

const stand = () => process.env.STAND_NAME || 'prod'

export const sendAlert = async (payload: Payload | null, key: string, title: string, text: string) => {
  if (!alertsConfigured()) return false
  const now = Date.now()
  const last = sentAt.get(key) ?? 0
  if (now - last < QUIET_MS) return false
  sentAt.set(key, now)
  // старые ключи не копим
  if (sentAt.size > 500) for (const [k, t] of sentAt) if (now - t > QUIET_MS) sentAt.delete(k)

  const admin = (process.env.SERVER_URL || '').replace(/\/$/, '')
  const body = `⚠️ jet.su [${stand()}]: ${title}\n\n${text.slice(0, 3000)}${admin ? `\n\n${admin}/admin` : ''}`
  const jobs: Promise<unknown>[] = []
  const token = process.env.ALERT_TELEGRAM_BOT_TOKEN
  const chat = process.env.ALERT_TELEGRAM_CHAT_ID
  if (token && chat) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: body, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(5000),
      }),
    )
  }
  const emails = (process.env.ALERT_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (emails.length && payload && process.env.SMTP_HOST) {
    jobs.push(payload.sendEmail({ to: emails, subject: `jet.su [${stand()}]: ${title}`, text: body }))
  }
  const results = await Promise.allSettled(jobs)
  for (const r of results) if (r.status === 'rejected') payload?.logger.error({ err: r.reason }, 'alert')
  return true
}
