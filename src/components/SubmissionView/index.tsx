/**
 * Карточка заявки: что заполнили, файлы, источник и журнал отправки — в читаемом виде.
 * Сами поля хранятся в скрытых полях коллекции.
 */
type Row = { name?: string | null; label?: string | null; value?: string | null }
type Delivery = { channel?: string; status?: string; attempts?: number | null; at?: string | null; target?: string | null; error?: string | null }
type FileRef = number | { id: number; filename?: string | null; filesize?: number | null; url?: string | null }

type Props = {
  data?: {
    fields?: Row[] | null
    files?: FileRef[] | null
    deliveries?: Delivery[] | null
    page?: string | null
    locale?: string | null
    utm?: Record<string, string> | null
    formTitle?: string | null
    captcha?: string | null
    recipients?: string | null
    createdAt?: string | null
  }
  payload?: { findByID: (args: Record<string, unknown>) => Promise<unknown> }
}

const CHANNEL: Record<string, string> = { email: 'Письмо', bitrix24: 'Битрикс24', friendwork: 'FriendWork' }
const STATUS: Record<string, [string, string]> = {
  pending: ['В очереди', 'gray'],
  sent: ['Отправлено', 'green'],
  retry: ['Ошибка, будет повтор', 'orange'],
  failed: ['Не удалось', 'red'],
  skipped: ['Не отправлялось', 'gray'],
}

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''

const size = (n?: number | null) => (n ? (n > 1048576 ? `${(n / 1048576).toFixed(1)} МБ` : `${Math.ceil(n / 1024)} КБ`) : '')

export const SubmissionView = async ({ data, payload }: Props) => {
  if (!data) return null
  const files: { id: number; filename?: string | null; filesize?: number | null; url?: string | null }[] = []
  for (const f of data.files ?? []) {
    if (f && typeof f === 'object') files.push(f)
    else if (payload && f) {
      const doc = (await payload.findByID({ collection: 'submission-files', id: f, depth: 0, overrideAccess: true }).catch(() => null)) as (typeof files)[number] | null
      if (doc) files.push(doc)
    }
  }
  const utm = data.utm ? Object.entries(data.utm) : []

  return (
    <div className="jet-sub">
      <section className="jet-card">
        <h3 className="jet-sub__h">Что заполнили</h3>
        <dl className="jet-sub__dl">
          {(data.fields ?? []).map((f, i) => (
            <div key={i} className="jet-sub__row">
              <dt>{f.label || f.name}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
        {files.length > 0 && (
          <div className="jet-sub__files">
            {files.map((f) => (
              <a key={f.id} className="jet-sub__file" href={f.url ?? '#'} target="_blank" rel="noopener noreferrer" download>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M7 3h7l5 5v13H7z M14 3v5h5 M12 11v6 M9 14l3 3 3-3" />
                </svg>
                {f.filename}
                <span className="jet-muted">{size(f.filesize)}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="jet-card">
        <h3 className="jet-sub__h">Откуда</h3>
        <dl className="jet-sub__dl">
          <div className="jet-sub__row">
            <dt>Форма</dt>
            <dd>{data.formTitle}</dd>
          </div>
          {data.page && (
            <div className="jet-sub__row">
              <dt>Страница</dt>
              <dd>
                <a href={data.page} target="_blank" rel="noopener noreferrer">
                  {data.page}
                </a>
              </dd>
            </div>
          )}
          <div className="jet-sub__row">
            <dt>Язык сайта</dt>
            <dd>{data.locale === 'en' ? 'английский' : 'русский'}</dd>
          </div>
          {utm.length > 0 && (
            <div className="jet-sub__row">
              <dt>Метки UTM</dt>
              <dd>{utm.map(([k, v]) => `${k}=${v}`).join(', ')}</dd>
            </div>
          )}
          <div className="jet-sub__row">
            <dt>Получена</dt>
            <dd>{fmt(data.createdAt)} (МСК)</dd>
          </div>
          <div className="jet-sub__row">
            <dt>Капча</dt>
            <dd>{data.captcha}</dd>
          </div>
        </dl>
      </section>

      <section className="jet-card">
        <h3 className="jet-sub__h">Журнал отправки</h3>
        {(data.deliveries ?? []).length === 0 && <p className="jet-muted">Отправок нет</p>}
        {(data.deliveries ?? []).map((d, i) => {
          const [label, color] = STATUS[d.status ?? 'pending'] ?? STATUS.pending
          return (
            <div key={i} className="jet-sub__delivery">
              <b>{CHANNEL[d.channel ?? ''] ?? d.channel}</b>
              <span className={`jet-pill jet-pill--${color}`}>{label}</span>
              <span className="jet-muted">{d.target}</span>
              <span className="jet-muted">
                {fmt(d.at)}
                {d.attempts && d.attempts > 1 ? ` · попыток: ${d.attempts}` : ''}
              </span>
              {d.error && <span className="jet-sub__err">{d.error}</span>}
            </div>
          )
        })}
      </section>
    </div>
  )
}
