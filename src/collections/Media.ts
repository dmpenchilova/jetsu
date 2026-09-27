import { createHash } from 'node:crypto'
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
    description: 'Файлы можно раскладывать по папкам. Картинки без alt и одинаковые файлы — в «Порядке в медиатеке»',
    components: { beforeListTable: ['/components/MediaToolsLink#MediaToolsLink'] },
  },
  // папки в медиатеке
  folders: true,
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        const file = req.file as { data?: Buffer } | undefined
        if (file?.data) data.hash = createHash('sha1').update(file.data).digest('hex')
        return data
      },
    ],
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
    imageSizes: [{ name: 'thumbnail', width: 400, withoutEnlargement: true, formatOptions: { format: 'webp', options: { quality: 80 } } }],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    // обрезка и поворот прямо в медиатеке
    crop: true,
    // слишком большие фото уменьшаются при загрузке (сайт всё равно отдаёт их через оптимизатор в AVIF/WebP)
    resizeOptions: { width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true },
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt-текст',
      type: 'text',
      localized: true,
      admin: { description: 'Что изображено — для незрячих и поисковиков. На каждом языке свой. Подставляется, если в блоке alt не задан' },
    },
    // отпечаток содержимого — для поиска одинаковых файлов
    { name: 'hash', type: 'text', index: true, admin: { hidden: true } },
    { name: 'sourcePath', type: 'text', index: true, admin: { hidden: true } },
    { name: 'usage', type: 'ui', admin: { components: { Field: '/components/MediaUsage#MediaUsage' } } },
  ],
}
