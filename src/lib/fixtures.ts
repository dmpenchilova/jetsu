import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.join(process.cwd(), 'src', 'contract', 'fixtures')

/** Тестовые данные фронта (apiStatic) по адресу эндпоинта; сначала ищется английская версия для lang=en. */
export const readFixture = async (endpoint: string, locale: 'ru' | 'en'): Promise<unknown> => {
  const clean = endpoint.replace(/^\/+|\/+$/g, '')
  if (!/^[a-z0-9/-]*$/.test(clean) || clean.includes('..')) return undefined
  const candidates = [
    ...(locale === 'en' ? [`en/${clean}.json`, `en/${clean}/index.json`] : []),
    `${clean}.json`,
    `${clean}/index.json`,
  ]
  for (const c of candidates) {
    try {
      return JSON.parse(await readFile(path.join(root, c), 'utf8'))
    } catch {
      // следующий вариант
    }
  }
  return undefined
}
