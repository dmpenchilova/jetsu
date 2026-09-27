/**
 * «Справка» — /admin/help. Разделы и текст — в content.ts.
 */
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'

import { HELP } from './content'

const Body = ({ text }: { text: string }) => {
  const out: React.ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length) out.push(<ul key={`l${out.length}`}>{list.map((li, i) => <li key={i}>{li}</li>)}</ul>)
    list = []
  }
  for (const line of text.split('\n')) {
    if (line.startsWith('- ')) list.push(line.slice(2))
    else {
      flush()
      if (line.trim()) out.push(<p key={`p${out.length}`}>{line}</p>)
    }
  }
  flush()
  return <>{out}</>
}

export const Help = (props: AdminViewServerProps) => {
  const { initPageResult } = props
  const { req, permissions, visibleEntities, locale } = initPageResult
  const role = (req.user as { role?: string } | null)?.role ?? ''
  const sections = HELP.filter((s) => !s.roles || s.roles.includes(role))
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
      <div className="gutter--left gutter--right jet-help">
        <h1>Справка</h1>
        <p className="jet-help__lead">Как работать в админке jet.su. Не нашли ответ — напишите администратору сайта.</p>
        <nav className="jet-help__toc" aria-label="Разделы справки">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.title}
            </a>
          ))}
        </nav>
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="jet-help__section">
            <h2>{s.title}</h2>
            <Body text={s.body} />
          </section>
        ))}
      </div>
    </DefaultTemplate>
  )
}
