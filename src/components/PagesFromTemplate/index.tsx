'use client'
/** Над списком страниц: «Создать из шаблона». */
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Tpl = { id: number; title: string; description?: string }

export const PagesFromTemplate = () => {
  const router = useRouter()
  const [items, setItems] = useState<Tpl[]>([])
  const [tpl, setTpl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/cms-api/page-templates?limit=200&depth=0&sort=title', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setItems(d.docs ?? []))
      .catch(() => setItems([]))
  }, [])

  if (!items.length) return null

  const create = async () => {
    if (!tpl) return
    setBusy(true)
    setError('')
    const res = await fetch('/cms-api/pages/from-template', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: Number(tpl) }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (data.id) router.push(`/admin/collections/pages/${data.id}`)
    else setError(data.error ?? data.errors?.[0]?.message ?? 'Не получилось создать страницу')
  }

  return (
    <div className="jet-toolbar">
      <span className="jet-muted">Новая страница из шаблона:</span>
      <select className="jet-select" value={tpl} onChange={(e) => setTpl(e.target.value)} aria-label="Шаблон страницы">
        <option value="">выберите шаблон</option>
        {items.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
            {t.description ? ` — ${t.description}` : ''}
          </option>
        ))}
      </select>
      <button type="button" className="jet-btn jet-btn--light" disabled={!tpl || busy} onClick={create}>
        {busy ? 'Создаю…' : 'Создать'}
      </button>
      {error && <span className="jet-error">{error}</span>}
    </div>
  )
}
