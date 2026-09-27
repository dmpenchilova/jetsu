/** Итоги опроса справа на странице опроса. */
import type { Payload } from 'payload'

import { pollResults } from '../../collections/Polls'

export const PollResults = async ({ data, payload }: { data?: { id?: number }; payload: Payload }) => {
  if (!data?.id) return null
  const r = await pollResults(payload, data.id, 'ru')
  return (
    <div className="jet-poll-results">
      <div className="jet-tools__title">Итоги · {r.total} ответов</div>
      {r.options.map((o) => (
        <div key={o.id} className="jet-poll-results__row">
          <div className="jet-small">
            {o.label} — <b>{o.percent}%</b> ({o.votes})
          </div>
          <div className="jet-poll-results__bar">
            <span style={{ width: `${o.percent}%` }} />
          </div>
        </div>
      ))}
      <a className="jet-btn jet-btn--light" href={`/cms-api/polls/${data.id}/export`}>
        Выгрузить CSV
      </a>
    </div>
  )
}
