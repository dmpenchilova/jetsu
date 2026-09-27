/**
 * Режим обслуживания: сайт показывает всем страницу «Ведутся работы» (ответ 503),
 * пока режим включён. Включение и выключение пишутся в журнал действий.
 */
import type { GlobalConfig, Payload } from 'payload'

import { hasRole, isLoggedIn } from '../access'

export const Maintenance: GlobalConfig = {
  slug: 'maintenance',
  label: 'Режим обслуживания',
  admin: {
    group: 'Настройки сайта',
    description: 'Пока режим включён, посетители видят страницу «Ведутся работы» (сайт подхватывает изменение в течение 30 секунд). Превью черновиков из админки продолжает работать',
  },
  access: { read: isLoggedIn, update: hasRole('admin') },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'enabled', label: 'Включить режим обслуживания', type: 'checkbox', admin: { width: '50%' } },
        {
          name: 'until',
          label: 'Выключится сам',
          type: 'date',
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' }, description: 'Пусто — пока не выключите' },
        },
      ],
    },
    { name: 'title', label: 'Заголовок', type: 'text', localized: true, defaultValue: 'На сайте ведутся технические работы' },
    { name: 'text', label: 'Текст', type: 'textarea', localized: true, defaultValue: 'Сайт скоро снова заработает. Спасибо за терпение!' },
  ],
}

export const maintenanceState = async (payload: Payload, locale: 'ru' | 'en') => {
  const doc = (await payload.findGlobal({ slug: 'maintenance', locale, depth: 0, overrideAccess: true }).catch(() => null)) as {
    enabled?: boolean
    until?: string | null
    title?: string | null
    text?: string | null
  } | null
  const enabled = !!doc?.enabled && (!doc.until || new Date(doc.until).getTime() > Date.now())
  return { enabled, title: doc?.title ?? '', text: doc?.text ?? '', until: doc?.until ?? null }
}
