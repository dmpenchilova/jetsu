import type { Payload } from 'payload'

/**
 * Сбрасывает кэш фронта по тегам через его /api/revalidate.
 * Если фронт не ответил, повторяет несколько раз с паузой; неудача пишется в журнал.
 */
export const revalidateFront = async (payload: Payload, tags: string[]) => {
  const front = process.env.FRONT_URL
  const secret = process.env.REVALIDATE_SECRET
  const unique = [...new Set(tags)].filter(Boolean)
  if (!front || unique.length === 0) return

  const url = `${front.replace(/\/$/, '')}/api/revalidate?tag=${encodeURIComponent(unique.join(','))}`
  const attempt = async (n: number): Promise<void> => {
    try {
      const res = await fetch(url, {
        headers: secret ? { 'x-revalidate-secret': secret } : {},
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      payload.logger.info({ msg: 'Кэш фронта сброшен', tags: unique })
    } catch (err) {
      if (n < 5) {
        setTimeout(() => void attempt(n + 1), 2000 * 2 ** n)
      } else {
        payload.logger.error({ msg: 'Не удалось сбросить кэш фронта', tags: unique, err: String(err) })
      }
    }
  }
  // не задерживаем сохранение в админке
  void attempt(0)
}

/** Тег кэша страницы конструктора во фронте. */
export const builderTag = (path: string) => `builder-${path}`
