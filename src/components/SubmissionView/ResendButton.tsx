'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/** «Отправить повторно» — письмо и интеграции уходят заново, результат появится в журнале. */
export const ResendButton = ({ id }: { id?: number }) => {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  if (!id) return null
  return (
    <div className="jet-sub__resend">
      <button
        type="button"
        className="jet-btn jet-btn--light"
        disabled={state === 'busy'}
        onClick={async () => {
          if (!window.confirm('Отправить заявку повторно? Получатели получат письмо ещё раз.')) return
          setState('busy')
          const res = await fetch(`/cms-api/submissions/${id}/resend`, { method: 'POST', credentials: 'include' }).catch(() => null)
          setState(res?.ok ? 'done' : 'error')
          if (res?.ok) setTimeout(() => router.refresh(), 1500)
        }}
      >
        Отправить повторно
      </button>
      {state === 'done' && <span className="jet-muted">Поставлено в очередь</span>}
      {state === 'error' && <span className="jet-sub__err">Не получилось</span>}
    </div>
  )
}
