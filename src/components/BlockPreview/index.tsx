'use client'
/** Кнопка «Превью блока»: открывает на сайте только этот блок (черновик, с последними правками). */
import { useDocumentInfo, useFormFields, useLocale } from '@payloadcms/ui'

type Props = { path?: string }

export const BlockPreview = ({ path }: Props) => {
  const { id } = useDocumentInfo()
  const locale = useLocale()
  const rowPath = (path ?? '').replace(/\.blockPreview$/, '')
  const blockId = useFormFields(([fields]) => fields[`${rowPath}.id`]?.value as string | undefined)
  if (!id || !blockId) return null
  const href = `/cms-api/pages/${id}/preview-block?block=${encodeURIComponent(blockId)}&locale=${locale?.code ?? 'ru'}`
  return (
    <div className="jet-block-preview">
      <a className="jet-btn jet-btn--light" href={href} target="_blank" rel="noopener noreferrer">
        Превью блока
      </a>
      <span className="jet-muted jet-small">Сохраните черновик, чтобы увидеть последние правки</span>
    </div>
  )
}
