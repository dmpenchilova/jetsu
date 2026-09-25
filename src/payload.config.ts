import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Partners, Vacancies } from './collections/Career'
import { Directions, Industries, Services, Subdirections } from './collections/Catalog'
import { Events, Offices } from './collections/Company'
import { Projects, Publications } from './collections/Expertise'
import { Forms } from './collections/Forms'
import { Media } from './collections/Media'
import { AuditLog, withAudit, withAuditGlobal } from './collections/AuditLog'
import { Pages } from './collections/Pages'
import { Redirects } from './collections/Redirects'
import { SearchIndex, SearchQueries } from './collections/Search'
import { SubmissionFiles, Submissions } from './collections/Submissions'
import { Terms } from './collections/Terms'
import { Users } from './collections/Users'
import { globals } from './globals'
import { FormSettings } from './globals/formSettings'
import { SeoSettings } from './globals/seoSettings'
import { TypographSettings } from './globals/typographSettings'
import { reindexAll, searchHooks } from './lib/search/indexer'
import { globalTextHook, textHook } from './lib/textHooks'
import { FORMS_QUEUE, formTasks } from './lib/forms/deliver'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// проверяем при запуске сервера, а не при сборке (при сборке секретов нет)
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
if (process.env.NODE_ENV === 'production' && !isBuild && (process.env.PAYLOAD_SECRET ?? '').length < 32) {
  throw new Error('PAYLOAD_SECRET должен быть не короче 32 символов')
}

/** Где работает типограф и чистка HTML: весь контент сайта. */
const TEXT_COLLECTIONS = new Set([
  'pages', 'publications', 'projects', 'events', 'services', 'directions', 'subdirections', 'industries',
  'vacancies', 'partners', 'offices', 'terms', 'forms',
])
/** Коллекции, которые попадают в поиск по сайту. */
const SEARCHABLE = new Set(['pages', 'publications', 'vacancies'])
const withSearch = <T extends { slug: string; hooks?: { afterChange?: unknown[]; afterDelete?: unknown[] } }>(c: T): T => {
  if (!SEARCHABLE.has(c.slug)) return c
  const h = searchHooks(c.slug as 'pages')
  return { ...c, hooks: { ...c.hooks, afterChange: [...(c.hooks?.afterChange ?? []), ...h.afterChange], afterDelete: [...(c.hooks?.afterDelete ?? []), ...h.afterDelete] } } as T
}

const withText = <T extends { slug: string; hooks?: { beforeChange?: unknown[] } }>(c: T, hook: unknown): T =>
  ({ ...c, hooks: { ...c.hooks, beforeChange: [...(c.hooks?.beforeChange ?? []), hook] } }) as T

export default buildConfig({
  serverURL: process.env.SERVER_URL || undefined,
  // /api занят API для фронта (так его ищет jet-front-main), собственный REST Payload — на /cms-api
  routes: { api: '/cms-api' },
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — админка jet.su' },
    // «25 сентября 2026, 20:44» вместо «сентября 25-е 2026, 8:44 ПП»
    dateFormat: 'd MMMM yyyy, HH:mm',
    avatar: 'default',
    components: {
      Nav: '/components/Nav#Nav',
      views: {
        dashboard: { Component: '/components/Dashboard#Dashboard' },
      },
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
    // в русском переводе Payload в подсказке поиска теряется название поля
    translations: { ru: { general: { searchBy: 'Поиск: {{label}}', or: 'или' } } },
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
    Events,
    Services,
    Directions,
    Subdirections,
    Industries,
    Vacancies,
    Partners,
    Offices,
    Terms,
    Media,
    Forms,
    Submissions,
    Redirects,
    SearchIndex,
    SearchQueries,
    AuditLog,
    SubmissionFiles,
    Users,
  ].map((c) => withAudit(withSearch(TEXT_COLLECTIONS.has(c.slug) ? withText(c, textHook) : c))),
  // папки (пока только в медиатеке)
  folders: { browseByFolder: false },
  globals: [...globals.map((g) => withText(g, globalTextHook)), FormSettings, TypographSettings, SeoSettings].map(withAuditGlobal),
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
  // письма: SMTP из .env; без SMTP_HOST письма не уходят, а в журнале заявки пишется причина
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'noreply@jet.su',
        defaultFromName: 'Сайт jet.su',
        skipVerify: true,
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        },
      })
    : undefined,
  // пустой индекс поиска (первый запуск, свежая база) собирается сам в фоне
  onInit: async (payload) => {
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.PAYLOAD_JOBS_AUTORUN === 'false') return
    const { totalDocs } = await payload.count({ collection: 'search-index' }).catch(() => ({ totalDocs: -1 }))
    if (totalDocs === 0) void reindexAll(payload).then((n) => payload.logger.info(`Индекс поиска собран: ${n} записей`)).catch(() => undefined)
  },
  jobs: {
    tasks: formTasks,
    // повторы отправок и ночная очистка; в служебных командах очередь не запускается
    autoRun: [{ cron: '* * * * *', queue: FORMS_QUEUE, limit: 20 }],
    shouldAutoRun: () => process.env.PAYLOAD_JOBS_AUTORUN !== 'false',
    deleteJobOnComplete: true,
    access: { run: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin', queue: () => false, cancel: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin' },
  },
})
