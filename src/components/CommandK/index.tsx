'use client'
/** Быстрый поиск по всей админке: Cmd+K (Ctrl+K). Разделы меню и записи всех разделов. */
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type NavItem = { label: string; href: string }
type Hit = { title: string; section: string; href: string }

export const openCommandK = () => window.dispatchEvent(new Event('jet:cmdk'))

export const CommandK = ({ nav }: { nav: NavItem[] }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('jet:cmdk', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('jet:cmdk', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 20)
    else {
      setQ('')
      setHits([])
    }
  }, [open])

  const search = useCallback(
    (text: string) => {
      const needle = text.trim().toLowerCase()
      const navHits: Hit[] = needle ? nav.filter((n) => n.label.toLowerCase().includes(needle)).map((n) => ({ title: n.label, section: 'Раздел', href: n.href })) : []
      setHits(navHits)
      setActive(0)
      clearTimeout(timer.current)
      if (needle.length < 2) return
      timer.current = setTimeout(async () => {
        const res = await fetch(`/cms-api/admin-search?q=${encodeURIComponent(text)}`, { credentials: 'include' }).catch(() => null)
        const data = res ? await res.json().catch(() => ({})) : {}
        setHits([...navHits, ...((data.hits as Hit[]) ?? [])])
      }, 200)
    },
    [nav],
  )

  const go = (hit?: Hit) => {
    if (!hit) return
    setOpen(false)
    router.push(hit.href)
  }

  if (!open) return null
  return (
    <div className="jet-cmdk" role="dialog" aria-modal="true" aria-label="Поиск по админке" onClick={() => setOpen(false)}>
      <div className="jet-cmdk__box" onClick={(e) => e.stopPropagation()}>
        <input
          ref={input}
          className="jet-cmdk__input"
          placeholder="Страница, публикация, вакансия, файл или раздел…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            search(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, hits.length - 1))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            }
            if (e.key === 'Enter') go(hits[active])
          }}
        />
        <ul className="jet-cmdk__list">
          {q.trim().length >= 2 && hits.length === 0 && <li className="jet-cmdk__empty">Ничего не найдено</li>}
          {hits.map((h, i) => (
            <li key={`${h.href}-${i}`}>
              <button type="button" className={`jet-cmdk__hit${i === active ? ' is-active' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => go(h)}>
                <span>{h.title}</span>
                <span className="jet-muted jet-small">{h.section}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="jet-cmdk__foot jet-muted jet-small">↑↓ — выбор · Enter — открыть · Esc — закрыть</div>
      </div>
    </div>
  )
}
