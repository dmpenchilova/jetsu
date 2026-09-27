'use client'
/** Перевод и согласование: колонки в списках и панель справа в записи. */
import { useAuth, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'

const T_LABEL: Record<string, [string, string]> = {
  none: ['нет', 'gray'],
  outdated: ['устарел', 'orange'],
  ok: ['есть', 'green'],
}
const R_LABEL: Record<string, [string, string]> = {
  review: ['на проверке', 'orange'],
  changes: ['нужны правки', 'red'],
  approved: ['согласовано', 'green'],
}

export const TranslationCell = ({ cellData }: { cellData?: string }) => {
  const [label, color] = T_LABEL[cellData ?? 'none'] ?? T_LABEL.none
  return <span className={`jet-pill jet-pill--${color}`}>{label}</span>
}

export const ReviewCell = ({ cellData }: { cellData?: string }) => {
  if (!cellData || cellData === 'none') return <span className="jet-muted">—</span>
  const [label, color] = R_LABEL[cellData] ?? ['', 'gray']
  return <span className={`jet-pill jet-pill--${color}`}>{label}</span>
}

type LogRow = { at?: string; user?: string; action?: string; text?: string }
const ACTION: Record<string, string> = {
  submit: 'отправил(а) на проверку',
  approve: 'согласовал(а)',
  changes: 'вернул(а) на доработку',
  translated: 'отметил(а) перевод актуальным',
  copyStructure: 'перенёс(ла) блоки в EN',
}

export const WorkflowPanel = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { user } = useAuth()
  const translation = useFormFields(([f]) => f.translationStatus?.value as string | undefined)
  const review = useFormFields(([f]) => f.reviewStatus?.value as string | undefined)
  const logRaw = useFormFields(([f]) => f.reviewLog?.rows?.length ?? 0)
  const [log, setLog] = useState<LogRow[] | null>(null)
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  if (!id || !collectionSlug) return null
  const role = (user as { role?: string } | null)?.role
  const editor = role === 'admin' || role === 'editor'

  const act = async (action: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    const res = await fetch(`/cms-api/${collectionSlug}/${id}/workflow`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, text }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (data.ok) {
      setText('')
      setMsg('Готово')
      // статусы хранятся в записи — перечитываем её
      setTimeout(() => window.location.reload(), 400)
    } else setMsg(data.error ?? 'Не получилось')
  }

  const loadLog = async () => {
    const res = await fetch(`/cms-api/${collectionSlug}/${id}?depth=0&draft=true&select[reviewLog]=true`, { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    setLog(((data.reviewLog as LogRow[]) ?? []).slice().reverse())
  }

  const [tLabel, tColor] = T_LABEL[translation ?? 'none'] ?? T_LABEL.none
  const [rLabel, rColor] = R_LABEL[review ?? ''] ?? ['не отправлялось', 'gray']

  return (
    <div className="jet-tools jet-workflow">
      <div className="jet-tools__title">
        Английская версия <span className={`jet-pill jet-pill--${tColor}`}>{tLabel}</span>
      </div>
      <div className="jet-tools__row">
        <a className="jet-btn jet-btn--light" href={`/admin/compare?c=${collectionSlug}&id=${id}`} target="_blank" rel="noopener noreferrer">
          Сравнить RU и EN
        </a>
        {collectionSlug === 'pages' && (
          <button type="button" className="jet-btn jet-btn--light" disabled={busy} onClick={() => act('copyStructure', 'Заменить блоки английской версии копией русских? Английские тексты в блоках будут заменены русскими.')}>
            Блоки RU → EN
          </button>
        )}
        {translation === 'outdated' && (
          <button type="button" className="jet-btn jet-btn--light" disabled={busy} onClick={() => act('translated')}>
            EN актуален
          </button>
        )}
      </div>

      <div className="jet-tools__title">
        Согласование <span className={`jet-pill jet-pill--${rColor}`}>{rLabel}</span>
      </div>
      <textarea
        className="jet-workflow__text"
        placeholder={editor ? 'Комментарий автору' : 'Комментарий для редактора (необязательно)'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
      />
      <div className="jet-tools__row">
        {review !== 'review' && (
          <button type="button" className="jet-btn jet-btn--light" disabled={busy} onClick={() => act('submit')}>
            Отправить на проверку
          </button>
        )}
        {editor && review === 'review' && (
          <>
            <button type="button" className="jet-btn jet-btn--light" disabled={busy} onClick={() => act('approve')}>
              Согласовать
            </button>
            <button type="button" className="jet-btn jet-btn--light" disabled={busy || !text.trim()} onClick={() => act('changes')} title="Напишите, что поправить">
              Вернуть на доработку
            </button>
          </>
        )}
      </div>
      {msg && <p className="jet-small">{msg}</p>}
      <button type="button" className="jet-link" onClick={loadLog}>
        История согласования{logRaw ? ` (${logRaw})` : ''}
      </button>
      {log && (
        <ul className="jet-workflow__log">
          {log.length === 0 && <li className="jet-muted">Пока пусто</li>}
          {log.map((l, i) => (
            <li key={i}>
              <span className="jet-muted jet-small">{l.at ? new Date(l.at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
              <span>
                <b>{l.user}</b> {ACTION[l.action ?? ''] ?? l.action}
              </span>
              {l.text && <span className="jet-workflow__comment">{l.text}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
