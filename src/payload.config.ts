import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Forms } from './collections/Forms'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Previews } from './collections/Previews'
import { Users } from './collections/Users'
import { globals } from './globals'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (process.env.NODE_ENV === 'production' && (process.env.PAYLOAD_SECRET ?? '').length < 32) {
  throw new Error('PAYLOAD_SECRET должен быть не короче 32 символов')
}

export default buildConfig({
  serverURL: process.env.SERVER_URL || undefined,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — админка jet.su' },
    importMap: { baseDir: path.resolve(dirname) },
  },
  i18n: {
    supportedLanguages: { ru, en },
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
  collections: [Pages, Media, Forms, Users, Previews],
  globals,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { disable: true },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    blocksAsJSON: true,
  }),
  sharp,
})
