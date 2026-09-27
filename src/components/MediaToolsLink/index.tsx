import Link from 'next/link'

/** Ссылка над списком медиатеки. */
export const MediaToolsLink = () => (
  <div className="jet-toolbar">
    <Link className="jet-btn jet-btn--light" href="/admin/media-tools">
      Порядок в медиатеке: картинки без alt и одинаковые файлы
    </Link>
  </div>
)
