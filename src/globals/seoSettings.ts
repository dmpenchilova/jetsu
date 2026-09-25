/**
 * Настройки SEO сайта: индексация, robots.txt, что не попадает в карту сайта.
 */
import type { GlobalConfig } from 'payload'

import { hasRole, isLoggedIn } from '../access'
import { revalidateFront } from '../lib/revalidate'

export const DEFAULT_ROBOTS = `User-agent: *
Disallow: /preview/
Disallow: /api/
Disallow: /*?*utm_
Allow: /`

export type SeoSettingsDoc = {
  indexing?: boolean | null
  robots?: string | null
  exclude?: string[] | null
}

export const SeoSettings: GlobalConfig = {
  slug: 'seo-settings',
  label: 'SEO и индексация',
  admin: { group: 'Настройки сайта', description: 'robots.txt и карта сайта sitemap.xml собираются автоматически из опубликованных страниц' },
  access: { read: isLoggedIn, update: hasRole('admin') },
  hooks: {
    afterChange: [
      async ({ req }) => {
        await revalidateFront(req.payload, ['seo'])
      },
    ],
  },
  fields: [
    {
      name: 'indexing',
      label: 'Разрешить поисковикам индексировать сайт',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Выключите на тестовом стенде: robots.txt запретит всё, а страницы получат noindex' },
    },
    {
      name: 'robots',
      label: 'robots.txt',
      type: 'textarea',
      defaultValue: DEFAULT_ROBOTS,
      custom: { typograph: false },
      admin: { rows: 10, description: 'Строка Sitemap с адресом карты сайта добавляется сама' },
    },
    {
      name: 'exclude',
      label: 'Не включать в карту сайта',
      type: 'text',
      hasMany: true,
      custom: { typograph: false },
      admin: { description: 'Адреса без домена, например /policy/. Можно начало адреса: /about/old/*' },
    },
  ],
}
