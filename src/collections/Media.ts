import path from 'node:path'

import type { CollectionConfig } from 'payload'

import { APIError } from 'payload'

import { hasRole, isLoggedIn } from '../access'
import { findMediaUsage } from '../lib/mediaUsage'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медиатека' },
  admin: {
    group: 'Контент',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    listSearchableFields: ['filename', 'alt'],
    description: 'Файлы можно раскладывать по папкам. Чтобы найти картинки без alt-текста, отфильтруйте по полю «Alt-текст» → «не существует»',
  },
  // папки в медиатеке
  folders: true,
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        const usages = await findMediaUsage(req.payload, id)
        if (usages.length) {
          const list = usages.slice(0, 5).map((u) => u.where).join('; ')
          throw new APIError(`Файл используется (${usages.length}): ${list}. Сначала уберите его оттуда`, 400, undefined, true)
        }
      },
    ],
  },
  access: {
    // файлы публичны: их показывает сайт
    read: () => true,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: hasRole('admin', 'editor'),
  },
  upload: {
    // папка с файлами; в Docker это том, который переживает пересборку
    staticDir: process.env.MEDIA_DIR || path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    imageSizes: [{ name: 'thumbnail', width: 400, withoutEnlargement: true }],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
  },
  fields: [
    { name: 'alt', label: 'Alt-текст', type: 'text', admin: { description: 'Что изображено. Подставляется, если в блоке alt не задан' } },
    { name: 'sourcePath', type: 'text', index: true, admin: { hidden: true } },
    { name: 'usage', type: 'ui', admin: { components: { Field: '/components/MediaUsage#MediaUsage' } } },
  ],
}
