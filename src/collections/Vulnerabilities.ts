/**
 * Уязвимости, найденные специалистами компании (раздел /vuln/ на сайте).
 */
import type { CollectionConfig } from 'payload'

import { contentAccess, drafts, guardPublish, revalidateHooks, seoFields, slugField } from './shared'

const HTML = { components: { Field: '/components/HtmlEditor#HtmlEditor' } }

export const Vulnerabilities: CollectionConfig = {
  slug: 'vulnerabilities',
  labels: { singular: 'Уязвимость', plural: 'Уязвимости' },
  admin: {
    useAsTitle: 'title',
    group: 'Экспертиза',
    defaultColumns: ['title', 'cve', 'cvss3', 'date', '_status'],
    listSearchableFields: ['title', 'cve', 'vendor'],
    description: 'Раздел сайта /vuln/: найденные специалистами уязвимости',
  },
  defaultSort: '-date',
  access: contentAccess('author'),
  versions: drafts,
  hooks: {
    ...revalidateHooks(['vuln'], { pathOf: (d) => (d.slug ? `/vuln/${d.slug}/` : null) }),
    beforeChange: [({ data, req }) => guardPublish({ data, req })],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Описание',
          fields: [
            { name: 'title', label: 'Название', type: 'text', required: true, localized: true },
            {
              type: 'row',
              fields: [
                { name: 'cve', label: 'Номер CVE / БДУ', type: 'text', required: true, admin: { width: '40%', placeholder: 'CVE-2026-12345, BDU:2026-01234' } },
                { name: 'date', label: 'Дата', type: 'date', required: true, admin: { width: '30%' } },
                {
                  name: 'state',
                  label: 'Статус',
                  type: 'select',
                  defaultValue: 'active',
                  options: [
                    { label: 'Активна', value: 'active' },
                    { label: 'Исправлена', value: 'fixed' },
                  ],
                  admin: { width: '30%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'vendor', label: 'Вендор', type: 'text', admin: { width: '40%' } },
                { name: 'product', label: 'Продукт и версии', type: 'text', localized: true, admin: { width: '60%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'cvss3', label: 'CVSS 3.1', type: 'number', min: 0, max: 10, admin: { width: '20%', step: 0.1 } },
                { name: 'vector3', label: 'Вектор 3.1', type: 'text', admin: { width: '30%' } },
                { name: 'cvss2', label: 'CVSS 2.0', type: 'number', min: 0, max: 10, admin: { width: '20%', step: 0.1 } },
                { name: 'vector2', label: 'Вектор 2.0', type: 'text', admin: { width: '30%' } },
              ],
            },
            { name: 'description', label: 'Описание', type: 'textarea', required: true, localized: true, admin: HTML },
            { name: 'fix', label: 'Как исправить', type: 'textarea', localized: true, admin: HTML },
            { name: 'workaround', label: 'Компенсирующая мера', type: 'textarea', localized: true, admin: HTML },
            { name: 'foundBy', label: 'Кто нашёл', type: 'text', localized: true },
          ],
        },
        {
          label: 'Ссылки',
          fields: [
            {
              name: 'links',
              label: 'Ссылки',
              type: 'group',
              fields: [
                { name: 'press', label: 'Пресс-релиз', type: 'text' },
                { name: 'github', label: 'GitHub', type: 'text' },
                { name: 'mitre', label: 'MITRE', type: 'text' },
                { name: 'bdu', label: 'БДУ ФСТЭК', type: 'text' },
              ],
            },
          ],
        },
        { label: 'SEO', fields: [seoFields] },
      ],
    },
    slugField('title', { description: 'Адрес: /vuln/<код>/' }),
  ],
}

/** Уровень опасности по CVSS 3.1. */
export const severityOf = (score?: number | null) => {
  if (score === null || score === undefined) return undefined
  if (score >= 9) return 'critical'
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  if (score > 0) return 'low'
  return 'none'
}
