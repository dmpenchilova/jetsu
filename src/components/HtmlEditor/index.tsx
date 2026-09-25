'use client'
/**
 * Визуальный редактор для длинных текстов блоков: жирный, курсив, ссылка, списки, подзаголовок,
 * выделение цветом (<span>), очистка форматирования и режим HTML.
 * Хранит обычную HTML-строку — в том виде, в каком её ждёт фронт.
 */
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { TextareaFieldClientComponent } from 'payload'
import { useCallback, useEffect, useRef, useState } from 'react'

import './editor.scss'

const ALLOWED = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'A', 'UL', 'OL', 'LI', 'SPAN', 'SUP', 'SUB', 'H3', 'H4'])

/** Чистка вставленного и отредактированного HTML: только разрешённые теги, без стилей и классов Word. */
const clean = (html: string) => {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild as HTMLElement
  const walk = (node: Element) => {
    for (const child of [...node.children]) {
      walk(child)
      if (child.tagName === 'DIV') {
        // строки из contentEditable приходят как <div> — превращаем в перенос строки
        const frag = doc.createDocumentFragment()
        frag.append(...child.childNodes)
        if (child.previousSibling) node.insertBefore(doc.createElement('br'), child)
        node.replaceChild(frag, child)
        continue
      }
      if (!ALLOWED.has(child.tagName)) {
        child.replaceWith(...child.childNodes)
        continue
      }
      for (const attr of [...child.attributes]) {
        const keep = child.tagName === 'A' && (attr.name === 'href' || attr.name === 'target')
        if (!keep) child.removeAttribute(attr.name)
      }
      if (child.tagName === 'A') {
        const href = child.getAttribute('href') ?? ''
        if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) child.removeAttribute('href')
        if (child.getAttribute('target') === '_blank') child.setAttribute('rel', 'noopener noreferrer')
      }
      // пустые теги форматирования убираем
      if (['B', 'STRONG', 'I', 'EM', 'U', 'SPAN'].includes(child.tagName) && !child.textContent) child.remove()
    }
  }
  walk(root)
  return root.innerHTML
    .replace(/&nbsp;/g, ' ')
    .replace(/(<br>)+$/, '')
    .trim()
}

type Cmd = { label: string; title: string; run: () => void; className?: string }

export const HtmlEditor: TextareaFieldClientComponent = (props) => {
  const { field, path: pathFromProps, readOnly } = props
  const { value, setValue, showError, path, disabled } = useField<string>({ potentiallyStalePath: pathFromProps })
  const [mode, setMode] = useState<'visual' | 'html'>('visual')
  const ref = useRef<HTMLDivElement>(null)
  const lastSet = useRef<string | undefined>(undefined)
  const locked = readOnly || disabled

  // значение пришло снаружи (загрузка, смена языка) — показываем его
  useEffect(() => {
    if (mode !== 'visual' || !ref.current) return
    if ((value ?? '') !== lastSet.current) {
      ref.current.innerHTML = value ?? ''
      lastSet.current = value ?? ''
    }
  }, [value, mode])

  const sync = useCallback(() => {
    if (!ref.current) return
    const html = clean(ref.current.innerHTML)
    lastSet.current = html
    setValue(html)
  }, [setValue])

  const exec = (command: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    sync()
  }

  const wrapSpan = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !ref.current?.contains(sel.anchorNode)) return
    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    span.append(range.extractContents())
    range.insertNode(span)
    sync()
  }

  const link = () => {
    const url = window.prompt('Адрес ссылки (https://… или /страница/)')
    if (!url) return
    exec('createLink', url.trim())
    if (/^https?:/i.test(url) && ref.current) {
      ref.current.querySelectorAll(`a[href="${CSS.escape(url.trim())}"]`).forEach((a) => a.setAttribute('target', '_blank'))
      sync()
    }
  }

  const commands: Cmd[] = [
    { label: 'Ж', title: 'Жирный', run: () => exec('bold'), className: 'is-bold' },
    { label: 'К', title: 'Курсив', run: () => exec('italic'), className: 'is-italic' },
    { label: 'Цвет', title: 'Выделить фирменным цветом (<span>)', run: wrapSpan },
    { label: 'Ссылка', title: 'Сделать ссылкой', run: link },
    { label: '• Список', title: 'Маркированный список', run: () => exec('insertUnorderedList') },
    { label: '1. Список', title: 'Нумерованный список', run: () => exec('insertOrderedList') },
    { label: 'H3', title: 'Подзаголовок', run: () => exec('formatBlock', 'h3') },
    { label: 'Абзац', title: 'Обычный абзац', run: () => exec('formatBlock', 'p') },
    { label: 'Очистить', title: 'Убрать оформление', run: () => exec('removeFormat') },
  ]

  return (
    <div className={`field-type textarea jet-html${showError ? ' error' : ''}`}>
      <FieldLabel label={field.label} path={path} required={field.required} localized={field.localized} />
      <div className="jet-html__box">
        <div className="jet-html__bar">
          {mode === 'visual' &&
            commands.map((c) => (
              <button
                key={c.label}
                type="button"
                title={c.title}
                className={`jet-html__btn ${c.className ?? ''}`}
                disabled={locked}
                onMouseDown={(e) => e.preventDefault()}
                onClick={c.run}
              >
                {c.label}
              </button>
            ))}
          <span className="jet-html__spacer" />
          <button type="button" className="jet-html__btn" onClick={() => setMode(mode === 'visual' ? 'html' : 'visual')}>
            {mode === 'visual' ? 'HTML' : 'Визуально'}
          </button>
        </div>
        <FieldError path={path} showError={showError} />
        {mode === 'visual' ? (
          <div
            ref={ref}
            className="jet-html__area"
            contentEditable={!locked}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={typeof field.label === 'string' ? field.label : undefined}
            onInput={sync}
            onBlur={sync}
            onKeyDown={(e) => {
              // Enter — перенос строки <br>, как в текстах сайта; новый абзац — кнопкой «Абзац»
              if (e.key === 'Enter' && !e.shiftKey && !document.queryCommandState('insertUnorderedList') && !document.queryCommandState('insertOrderedList')) {
                e.preventDefault()
                document.execCommand('insertLineBreak')
                sync()
              }
            }}
            onPaste={(e) => {
              e.preventDefault()
              const html = e.clipboardData.getData('text/html')
              const text = e.clipboardData.getData('text/plain')
              const insert = html ? clean(html) : text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')
              document.execCommand('insertHTML', false, insert)
              sync()
            }}
          />
        ) : (
          <textarea
            className="jet-html__code"
            value={value ?? ''}
            readOnly={locked}
            spellCheck={false}
            onChange={(e) => {
              lastSet.current = undefined
              setValue(e.target.value)
            }}
          />
        )}
      </div>
      <FieldDescription
        path={path}
        description={field.admin?.description ?? 'Enter — перенос строки. Кавычки, тире и неразрывные пробелы расставит типограф при публикации'}
      />
    </div>
  )
}
