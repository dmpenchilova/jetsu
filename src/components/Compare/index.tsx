/**
 * Сравнение русской и английской версий: блоки и поля рядом, пустое в EN подсвечено.
 * Открывается из панели «Английская версия»: /admin/compare?c=pages&id=12
 */
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'

import { BLOCK_META } from '../../blocks/meta'
import { collectText } from '../../lib/search/indexer'

type Doc = Record<string, unknown>
const strip = (v: unknown) => (typeof v === 'string' ? v.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '')

const Cell = ({ text }: { text: string }) =>
  text ? <div className="jet-compare__cell">{text.length > 600 ? `${text.slice(0, 600)}…` : text}</div> : <div className="jet-compare__cell jet-compare__cell--empty">нет текста</div>

export const Compare = async (props: AdminViewServerProps) => {
  const { initPageResult, searchParams } = props
  const { req, permissions, visibleEntities, locale } = initPageResult
  const sp = (searchParams ?? {}) as Record<string, string>
  const slug = String(sp.c ?? '')
  const id = String(sp.id ?? '')
  const allowed = ['pages', 'publications', 'vacancies', 'projects', 'events']
  let body: React.ReactNode = <p>Не выбрана запись</p>

  if (req.user && allowed.includes(slug) && /^\d+$/.test(id)) {
    const [ru, en] = (await Promise.all(
      (['ru', 'en'] as const).map((l) => req.payload.findByID({ collection: slug as 'pages', id, locale: l, depth: 0, draft: true, overrideAccess: false, user: req.user }).catch(() => null)),
    )) as (Doc | null)[]
    if (ru) {
      const rows: { label: string; ru: string; en: string }[] = [{ label: 'Название', ru: strip(ru.title), en: strip(en?.title) }]
      if (slug === 'pages') {
        const ruBlocks = (ru.content as Doc[]) ?? []
        const enBlocks = (en?.content as Doc[]) ?? []
        const n = Math.max(ruBlocks.length, enBlocks.length)
        for (let i = 0; i < n; i += 1) {
          const r = ruBlocks[i]
          const e = enBlocks[i]
          const type = String(r?.blockType ?? e?.blockType ?? '')
          const typeNote = r && e && r.blockType !== e.blockType ? ` · в EN другой блок: ${BLOCK_META[String(e.blockType)]?.label ?? e.blockType}` : ''
          rows.push({ label: `${i + 1}. ${BLOCK_META[type]?.label ?? type}${typeNote}`, ru: r ? collectText(r).join(' · ') : '', en: e ? collectText(e).join(' · ') : '' })
        }
      } else {
        const skip = new Set(['id', 'title', 'slug', 'createdAt', 'updatedAt', '_status', 'reviewLog', 'ruEditedAt', 'enEditedAt', 'translationStatus', 'reviewStatus'])
        for (const key of Object.keys(ru)) {
          if (skip.has(key)) continue
          const r = collectText(ru[key]).join(' · ')
          const e = collectText(en?.[key]).join(' · ')
          if (r || e) rows.push({ label: key, ru: r, en: e })
        }
      }
      body = (
        <>
          <p className="jet-muted">
            Черновики обеих версий. Пустые места в английской версии подсвечены. <a href={`/admin/collections/${slug}/${id}`}>Вернуться к записи</a>
          </p>
          <div className="jet-compare">
            <div className="jet-compare__head">Поле / блок</div>
            <div className="jet-compare__head">Русский</div>
            <div className="jet-compare__head">English</div>
            {rows.map((r, i) => (
              <div key={i} className="jet-compare__row">
                <div className="jet-compare__label">{r.label}</div>
                <Cell text={r.ru} />
                <Cell text={r.en} />
              </div>
            ))}
          </div>
        </>
      )
    }
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
        <h1>Сравнение RU и EN</h1>
        {body}
      </div>
    </DefaultTemplate>
  )
}
