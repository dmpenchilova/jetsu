'use client'
import { useState } from 'react'

type Row = { id: number; filename: string; thumb: string; ruAlt: string; enAlt: string }
type Dup = { id: number; filename: string; thumb: string }

export const MediaToolsClient = ({ noAlt, duplicates }: { noAlt: Row[]; duplicates: Dup[][] }) => {
  const [tab, setTab] = useState<'alt' | 'dups'>('alt')
  const [rows, setRows] = useState(noAlt)
  const [dirty, setDirty] = useState<Set<number>>(new Set())
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const edit = (id: number, key: 'ruAlt' | 'enAlt', value: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
    setDirty((d) => new Set(d).add(id))
  }

  const save = async () => {
    setBusy(true)
    let ok = 0
    for (const r of rows.filter((x) => dirty.has(x.id))) {
      for (const [locale, alt] of [
        ['ru', r.ruAlt],
        ['en', r.enAlt],
      ] as const) {
        const res = await fetch(`/cms-api/media/${r.id}?locale=${locale}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alt }),
        })
        if (res.ok) ok += 1
      }
    }
    setBusy(false)
    setDirty(new Set())
    setMsg(`Сохранено: ${ok / 2} файлов`)
  }

  return (
    <div className="jet-mtools">
      <div className="jet-toolbar">
        <button type="button" className={`jet-btn jet-btn--light${tab === 'alt' ? ' is-active' : ''}`} onClick={() => setTab('alt')}>
          Без alt · {noAlt.length}
        </button>
        <button type="button" className={`jet-btn jet-btn--light${tab === 'dups' ? ' is-active' : ''}`} onClick={() => setTab('dups')}>
          Одинаковые файлы · {duplicates.length}
        </button>
      </div>

      {tab === 'alt' && (
        <>
          <p className="jet-muted">Опишите, что изображено. Для логотипов достаточно названия компании. Сохраняются только изменённые строки.</p>
          <div className="jet-mtools__list">
            {rows.map((r) => (
              <div key={r.id} className="jet-mtools__row">
                <a href={`/admin/collections/media/${r.id}`} className="jet-mtools__thumb" title={r.filename}>
                  {r.thumb ? <img src={r.thumb} alt="" loading="lazy" /> : null}
                </a>
                <div className="jet-mtools__name jet-small">{r.filename}</div>
                <input placeholder="Alt по-русски" value={r.ruAlt} onChange={(e) => edit(r.id, 'ruAlt', e.target.value)} />
                <input placeholder="Alt in English" value={r.enAlt} onChange={(e) => edit(r.id, 'enAlt', e.target.value)} />
              </div>
            ))}
            {rows.length === 0 && <p>У всех картинок есть alt на обоих языках.</p>}
          </div>
          <div className="jet-mtools__save">
            <button type="button" className="jet-btn jet-btn--dark" disabled={!dirty.size || busy} onClick={save}>
              {busy ? 'Сохраняю…' : `Сохранить${dirty.size ? ` (${dirty.size})` : ''}`}
            </button>
            {msg && <span className="jet-small">{msg}</span>}
          </div>
        </>
      )}

      {tab === 'dups' && (
        <>
          <p className="jet-muted">
            Файлы с одинаковым содержимым. Оставьте один: откройте лишний файл — там видно, где он используется, — замените его в этих местах на
            оставшийся и удалите.
          </p>
          {duplicates.length === 0 && <p>Одинаковых файлов нет.</p>}
          {duplicates.map((g, i) => (
            <div key={i} className="jet-card jet-mtools__dup">
              {g.map((d) => (
                <a key={d.id} href={`/admin/collections/media/${d.id}`} className="jet-mtools__dupitem">
                  {d.thumb ? <img src={d.thumb} alt="" loading="lazy" /> : <span className="jet-mtools__file">файл</span>}
                  <span className="jet-small">{d.filename}</span>
                </a>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
