'use client'
/** Кнопка «Сделать редирект» в записи журнала 404. */
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'

export const NotFoundRedirect = () => {
  const { id } = useDocumentInfo()
  const path = useFormFields(([f]) => f.path?.value as string | undefined)
  const fixed = useFormFields(([f]) => f.fixed?.value as boolean | undefined)
  const [to, setTo] = useState('')
  const [msg, setMsg] = useState('')
  if (!id || !path) return null
  const create = async () => {
    const res = await fetch('/cms-api/redirects', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: path, to, code: '301', active: true, note: 'Из журнала 404' }),
    })
    const data = await res.json().catch(() => ({}))
    if (data.doc?.id) {
      await fetch(`/cms-api/not-found-log/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fixed: true }) })
      setMsg('Редирект создан. Сайт подхватит его в течение минуты.')
    } else setMsg(data.errors?.[0]?.message ?? 'Не получилось')
  }
  return (
    <div className="jet-card jet-usage">
      <b>{fixed ? 'Редирект уже есть' : 'Сделать редирект'}</b>
      <div className="jet-toolbar" style={{ marginTop: 8 }}>
        <span className="jet-muted">{path} →</span>
        <input className="jet-select" style={{ minWidth: 280 }} placeholder="/новый-адрес/" value={to} onChange={(e) => setTo(e.target.value)} />
        <button type="button" className="jet-btn jet-btn--light" disabled={!to.trim()} onClick={create}>
          Создать
        </button>
      </div>
      {msg && <p className="jet-small">{msg}</p>}
    </div>
  )
}
