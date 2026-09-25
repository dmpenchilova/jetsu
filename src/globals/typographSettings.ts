/**
 * Настройки типографа. Типограф срабатывает при публикации (и при сохранении записей без черновиков):
 * расставляет «ёлочки», тире, неразрывные пробелы после коротких слов и в названии компании.
 */
import type { GlobalConfig } from 'payload'

import { hasRole, isLoggedIn } from '../access'

export const TypographSettings: GlobalConfig = {
  slug: 'typograph-settings',
  label: 'Типограф',
  admin: {
    group: 'Настройки сайта',
    description:
      'Срабатывает при публикации: кавычки «ёлочки», тире, неразрывные пробелы после предлогов и союзов, «Инфосистемы Джет» без переноса. Код, адреса и HTML-теги не трогает',
  },
  access: { read: isLoggedIn, update: hasRole('admin') },
  fields: [
    { name: 'enabled', label: 'Типограф включён', type: 'checkbox', defaultValue: true },
    { name: 'yo', label: 'Заменять «ё» на «е»', type: 'checkbox', defaultValue: true },
    {
      name: 'nbHyphen',
      label: 'Неразрывный дефис в коротких словах («из‑за», «IT‑отдел»)',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'В шрифте сайта OnyOne нет этого знака — браузер возьмёт его из другого шрифта. Включайте, только если это устраивает' },
    },
  ],
}
