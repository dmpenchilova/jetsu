import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Partners, Vacancies } from './collections/Career'
import { Directions, Industries, Services, Subdirections } from './collections/Catalog'
import { Projects, Publications } from './collections/Expertise'
import { Forms } from './collections/Forms'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Terms } from './collections/Terms'
import { Users } from './collections/Users'
import { globals } from './globals'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// проверяем при запуске сервера, а не при сборке (при сборке секретов нет)
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
if (process.env.NODE_ENV === 'production' && !isBuild && (process.env.PAYLOAD_SECRET ?? '').length < 32) {
  throw new Error('PAYLOAD_SECRET должен быть не короче 32 символов')
}

export default buildConfig({
  serverURL: process.env.SERVER_URL || undefined,
  // /api занят API для фронта (так его ищет jet-front-main), собственный REST Payload — на /cms-api
  routes: { api: '/cms-api' },
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — админка jet.su' },
    avatar: 'default',
    components: {
      graphics: {
        Logo: '/components/Logo#Logo',
        Icon: '/components/Icon#Icon',
      },
    },
    importMap: { baseDir: path.resolve(dirname) },
  },
  i18n: {
    supportedLanguages: { ru },
    fallbackLanguage: 'ru',
  },
  localization: {
    locales: [
      { label: 'Русский', code: 'ru' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'ru',
    fallback: false,
  },
  collections: [
    Pages,
    Publications,
    Projects,
    Services,
    Directions,
    Subdirections,
    Industries,
    Vacancies,
    Partners,
    Terms,
    Media,
    Forms,
    Users,
  ],
  globals,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { disable: true },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    blocksAsJSON: true,
    // схему базы меняем только миграциями; автоподстройку для локальной разработки включает PAYLOAD_DB_PUSH=true
    push: process.env.PAYLOAD_DB_PUSH === 'true',
    // в production схема базы меняется только миграциями, они применяются при запуске
    prodMigrations: migrations,
  }),
  sharp,
})
