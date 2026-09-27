'use client'
/**
 * Панель справа на странице: ссылка на черновик для коллег, сохранить как шаблон.
 * Здесь же слушаем клики по блокам в превью: админка раскрывает и показывает поля блока.
 */
import { useDocumentInfo, useForm, useLocale } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

const focusBlock = (getFields: () => Record<string, { value?: unknown }>, blockId: string) => {
  const fields = getFields()
  const rowId = blockId.split('-')[0]
  const key = Object.keys(fields).find((k) => /^content\.\d+\.id$/.test(k) && String(fields[k]?.value) === rowId)
  if (!key) return
  const index = key.split('.')[1]
  const row = document.getElementById(`content-row-${index}`)
  if (!row) return
  // открыть вкладку «Содержимое», если открыта другая
  const tab = Array.from(document.querySelectorAll<HTMLButtonElement>('.tabs-field__tab-button')).find((b) => /Содержимое/.test(b.textContent ?? ''))
  tab?.click()
  const collapsible = row.querySelector('.collapsible')
  if (collapsible?.classList.contains('collapsible--collapsed')) {
    collapsible.querySelector<HTMLButtonElement>('.collapsible__toggle')?.click()
  }
  row.scrollIntoView({ behavior: 'smooth', block: 'start' })
  row.classList.add('jet-row-flash')
  setTimeout(() => row.classList.remove('jet-row-flash'), 2000)
}

export const PageTools = () => {
  const { id } = useDocumentInfo()
  const { getFields } = useForm()
  const locale = useLocale()
  const [msg, setMsg] = useState('')
  const [share, setShare] = useState<{ url: string; expires: string } | null>(null)

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'jet:focus-block' && typeof e.data.id === 'string') focusBlock(getFields as never, e.data.id)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [getFields])

  if (!id) return null

  const saveTemplate = async () => {
    const title = window.prompt('Название шаблона', '')
    if (title === null) return
    const res = await fetch('/cms-api/page-templates/from-page', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: id, title }),
    })
    const data = await res.json().catch(() => ({}))
    setMsg(data.id ? 'Шаблон сохранён — он появится в списке страниц в «Создать из шаблона»' : data.error ?? 'Не получилось сохранить')
  }

  const makeLink = async (days: number) => {
    const res = await fetch(`/cms-api/pages/${id}/share-link?days=${days}&locale=${locale?.code ?? 'ru'}`, { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    if (data.url) {
      setShare(data)
      navigator.clipboard?.writeText(data.url).catch(() => undefined)
    } else setMsg(data.error ?? 'Не получилось сделать ссылку')
  }

  return (
    <div className="jet-tools">
      <div className="jet-tools__title">Показать черновик коллегам</div>
      <p className="jet-muted jet-small">Ссылка открывается без входа в админку и показывает последний сохранённый черновик</p>
      <div className="jet-tools__row">
        {[1, 7, 30].map((d) => (
          <button key={d} type="button" className="jet-btn jet-btn--light" onClick={() => makeLink(d)}>
            {d === 1 ? 'на сутки' : `на ${d} дней`}
          </button>
        ))}
      </div>
      {share && (
        <div className="jet-tools__share">
          <input readOnly value={share.url} onFocus={(e) => e.currentTarget.select()} aria-label="Ссылка на черновик" />
          <span className="jet-muted jet-small">
            Скопирована. Действует до {new Date(share.expires).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      <div className="jet-tools__title">Шаблон</div>
      <button type="button" className="jet-btn jet-btn--light" onClick={saveTemplate}>
        Сохранить как шаблон
      </button>
      <p className="jet-muted jet-small">
        Копия страницы — меню «⋮» → «Дублировать». Блок на другую страницу — «⋮» у блока → «Копировать строку», затем «Вставить строку» на
        другой странице. В превью справа клик по блоку открывает его поля.
      </p>
      {msg && <p className="jet-small">{msg}</p>}
    </div>
  )
}
