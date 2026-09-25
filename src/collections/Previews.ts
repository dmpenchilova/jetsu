import type { CollectionConfig } from 'payload'

/** Снимки черновиков для предпросмотра на фронте по ссылке /preview?hash=… (живут 24 часа). */
export const Previews: CollectionConfig = {
  slug: 'previews',
  labels: { singular: 'Предпросмотр', plural: 'Предпросмотры' },
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'hash', type: 'text', required: true, unique: true, index: true },
    { name: 'locale', type: 'text' },
    { name: 'data', type: 'json', required: true },
    { name: 'expiresAt', type: 'date', required: true, index: true },
  ],
}
