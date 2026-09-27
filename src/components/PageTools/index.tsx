'use client'
/** Панель справа на странице: сохранить как шаблон и другие действия со страницей. */
import { useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

export const PageTools = () => {
  const { id } = useDocumentInfo()
  const [msg, setMsg] = useState('')
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

  return (
    <div className="jet-tools">
      <div className="jet-tools__title">Действия</div>
      <button type="button" className="jet-btn jet-btn--light" onClick={saveTemplate}>
        Сохранить как шаблон
      </button>
      <p className="jet-muted jet-small">
        Копия страницы — в меню «⋮» → «Дублировать». Блок на другую страницу — «⋮» у блока → «Копировать строку», затем «Вставить строку» на другой странице.
      </p>
      {msg && <p className="jet-small">{msg}</p>}
    </div>
  )
}
