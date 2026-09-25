import type { CollectionConfig } from 'payload'

import { hasRole, isLoggedIn } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медиатека' },
  admin: {
    group: 'Контент',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
  },
  access: {
    // файлы публичны: их показывает сайт
    read: () => true,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: hasRole('admin', 'editor'),
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    imageSizes: [{ name: 'thumbnail', width: 400, withoutEnlargement: true }],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
  },
  fields: [
    { name: 'alt', label: 'Alt-текст', type: 'text', admin: { description: 'Что изображено. Подставляется, если в блоке alt не задан' } },
    { name: 'sourcePath', type: 'text', index: true, admin: { hidden: true } },
  ],
}
