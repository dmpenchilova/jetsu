/** Список мест, где используется файл, — на странице файла в медиатеке. */
import type { Payload } from 'payload'

import { findMediaUsage } from '../../lib/mediaUsage'

type Props = { data?: { id?: number | string } | null; payload: Payload }

export const MediaUsage = async ({ data, payload }: Props) => {
  if (!data?.id) return null
  const usages = await findMediaUsage(payload, data.id)
  return (
    <div className="jet-card jet-usage">
      <div className="jet-usage__head">
        <b>Где используется</b>
        <span className="jet-muted">{usages.length}</span>
      </div>
      {usages.length === 0 ? (
        <p className="jet-muted">Файл нигде не используется — его можно удалить.</p>
      ) : (
        <>
          <ul className="jet-usage__list">
            {usages.map((u, i) => (
              <li key={i}>
                <a href={u.href}>{u.where}</a>
                <span className="jet-muted jet-small">{u.field}</span>
              </li>
            ))}
          </ul>
          <p className="jet-muted jet-small">
            Удалить нельзя, пока файл используется. Чтобы заменить картинку везде сразу, загрузите новый файл здесь же — кнопкой замены
            файла вверху.
          </p>
        </>
      )}
    </div>
  )
}
