/**
 * Настройки приёма заявок: кому уходят письма, сколько хранить заявки, какие интеграции включены.
 * Ключи и пароли (SMTP, капча, вебхуки) задаются в .env сервера, не здесь.
 */
import type { Field, GlobalConfig } from 'payload'

import { hasRole, isLoggedIn } from '../access'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Список адресов: вводятся по одному через Enter. */
export const emailsField = (name: string, label: string, description?: string): Field => ({
  name,
  label,
  type: 'text',
  hasMany: true,
  admin: { placeholder: 'Введите адрес и нажмите Enter', ...(description ? { description } : {}) },
  validate: (value: string[] | null | undefined) => {
    const bad = (value ?? []).filter((v) => !EMAIL.test(v))
    return bad.length ? `Неверный адрес: ${bad.join(', ')}` : true
  },
})

export type FormSettingsDoc = {
  recipients?: { business?: string[] | null; vacancy?: string[] | null; quality?: string[] | null; incident?: string[] | null } | null
  copy?: string[] | null
  fromName?: string | null
  subjectPrefix?: string | null
  retentionDays?: number | null
  rateLimit?: { perMinute?: number | null; perHour?: number | null } | null
  maxFileMb?: number | null
  bitrix24?: { enabled?: boolean | null; kinds?: string[] | null; dropAfterSend?: boolean | null } | null
  friendwork?: { enabled?: boolean | null } | null
}

export const FormSettings: GlobalConfig = {
  slug: 'form-settings',
  label: 'Настройки форм',
  admin: {
    group: 'Формы',
    description: 'Кому уходят заявки и сколько они хранятся. Адреса можно вводить через Enter',
  },
  access: { read: isLoggedIn, update: hasRole('admin') },
  fields: [
    {
      name: 'recipients',
      label: 'Получатели по типу формы',
      type: 'group',
      admin: { description: 'К ним добавляются ящик центра и получатели, указанные в самой форме' },
      fields: [
        emailsField('business', 'Бизнес-запрос'),
        emailsField('vacancy', 'Отклик на вакансию'),
        emailsField('quality', 'Качество сервисной поддержки'),
        emailsField('incident', 'Сообщить об инциденте'),
      ],
    },
    emailsField('copy', 'Копия всех писем', 'Например, ящик маркетинга для контроля'),
    {
      type: 'row',
      fields: [
        { name: 'fromName', label: 'Имя отправителя', type: 'text', defaultValue: 'Сайт jet.su', admin: { width: '50%' } },
        { name: 'subjectPrefix', label: 'Начало темы письма', type: 'text', defaultValue: '[jet.su]', admin: { width: '50%' } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Хранение и защита от спама',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'retentionDays',
              label: 'Хранить заявки, дней',
              type: 'number',
              defaultValue: 90,
              min: 1,
              max: 3650,
              admin: { width: '33%', description: 'Потом заявка и файлы удаляются' },
            },
            {
              name: 'maxFileMb',
              label: 'Размер файла, МБ',
              type: 'number',
              defaultValue: 10,
              min: 1,
              max: 50,
              admin: { width: '33%' },
            },
          ],
        },
        {
          name: 'rateLimit',
          label: 'Не больше заявок с одного адреса',
          type: 'group',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'perMinute', label: 'в минуту', type: 'number', defaultValue: 3, min: 1, admin: { width: '33%' } },
                { name: 'perHour', label: 'в час', type: 'number', defaultValue: 20, min: 1, admin: { width: '33%' } },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Интеграции',
      admin: { description: 'Подключаются на последнем этапе: нужны вебхук Битрикс24 и доступ к API FriendWork' },
      fields: [
        {
          name: 'bitrix24',
          label: 'Битрикс24 (лиды)',
          type: 'group',
          fields: [
            { name: 'enabled', label: 'Передавать заявки в Битрикс24', type: 'checkbox', defaultValue: false },
            {
              name: 'kinds',
              label: 'Какие формы',
              type: 'select',
              hasMany: true,
              defaultValue: ['business', 'quality', 'incident'],
              options: [
                { label: 'Бизнес-запрос', value: 'business' },
                { label: 'Качество сервисной поддержки', value: 'quality' },
                { label: 'Сообщить об инциденте', value: 'incident' },
              ],
            },
            {
              name: 'dropAfterSend',
              label: 'Удалять данные заявки с сайта после передачи',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Останется только отметка об отправке' },
            },
          ],
        },
        {
          name: 'friendwork',
          label: 'FriendWork (отклики)',
          type: 'group',
          fields: [{ name: 'enabled', label: 'Передавать отклики на вакансии в FriendWork', type: 'checkbox', defaultValue: false }],
        },
      ],
    },
  ],
}
