/**
 * «Порядок в медиатеке»: массовое заполнение alt (RU и EN) и поиск одинаковых файлов.
 * /admin/media-tools
 */
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'

import { MediaToolsClient } from './client'

type Media = { id: number; filename?: string; url?: string; mimeType?: string; hash?: string; filesize?: number; sizes?: { thumbnail?: { url?: string } } }

export const MediaTools = async (props: AdminViewServerProps) => {
  const { initPageResult } = props
  const { req, permissions, visibleEntities, locale } = initPageResult
  let content: React.ReactNode = <p>Нужно войти в админку</p>
  if (req.user) {
    // картинки без alt хотя бы на одном языке
    const [ru, en] = await Promise.all(
      (['ru', 'en'] as const).map((l) =>
        req.payload.find({ collection: 'media', locale: l, where: { and: [{ mimeType: { like: 'image/' } }] }, limit: 2000, depth: 0, pagination: false, user: req.user, overrideAccess: false }),
      ),
    )
    const enAlt = new Map(en.docs.map((d) => [d.id, (d as { alt?: string }).alt ?? '']))
    const noAlt = ru.docs
      .map((d) => ({ ...(d as unknown as Media), ruAlt: (d as { alt?: string }).alt ?? '', enAlt: enAlt.get(d.id) ?? '' }))
      .filter((d) => !d.ruAlt || !d.enAlt)
      .map((d) => ({ id: d.id, filename: d.filename ?? '', thumb: d.sizes?.thumbnail?.url || d.url || '', ruAlt: d.ruAlt, enAlt: d.enAlt }))

    // одинаковые файлы — по отпечатку содержимого
    const all = await req.payload.find({ collection: 'media', where: { hash: { exists: true } }, limit: 5000, depth: 0, pagination: false, user: req.user, overrideAccess: false })
    const groups = new Map<string, Media[]>()
    for (const d of all.docs as unknown as Media[]) if (d.hash) groups.set(d.hash, [...(groups.get(d.hash) ?? []), d])
    const dups = [...groups.values()]
      .filter((g) => g.length > 1)
      .map((g) => g.map((d) => ({ id: d.id, filename: d.filename ?? '', thumb: d.sizes?.thumbnail?.url || (d.mimeType?.startsWith('image/') ? d.url : '') || '' })))

    content = <MediaToolsClient noAlt={noAlt} duplicates={dups} />
  }
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={props.params}
      payload={req.payload}
      permissions={permissions}
      searchParams={props.searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <div className="gutter--left gutter--right jet-compare-page">
        <h1>Порядок в медиатеке</h1>
        {content}
      </div>
    </DefaultTemplate>
  )
}
