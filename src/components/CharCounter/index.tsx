'use client'
/** Счётчик символов под полем: «84 / 150». Красный — если текст не поместится в макет. */
import { useFormFields } from '@payloadcms/ui'

type Props = { path?: string; field?: { admin?: { custom?: { maxChars?: number } } } }

export const visibleLength = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, ' ').length

export const CharCounter = ({ path, field }: Props) => {
  const value = useFormFields(([fields]) => (path ? fields[path]?.value : undefined))
  const max = field?.admin?.custom?.maxChars
  const length = typeof value === 'string' ? visibleLength(value) : 0
  if (!length && !max) return null
  const over = max !== undefined && length > max
  return (
    <div className={`jet-counter${over ? ' jet-counter--over' : ''}`} aria-live="polite">
      {length}
      {max !== undefined ? ` / ${max}` : ''}
      {over ? ' — не поместится в макет' : ''}
    </div>
  )
}
