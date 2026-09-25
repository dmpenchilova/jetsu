import type { ServerProps, VisibleEntities } from 'payload'

import { NAV_ITEMS } from './items'
import { NavClient } from './NavClient'

const ROLE_LABELS: Record<string, string> = { admin: 'Администратор', editor: 'Редактор', author: 'Автор', hr: 'HR' }

/** Меню админки в стиле макета. Пункты без доступа не показываются. */
export const Nav = (props: ServerProps & { visibleEntities?: VisibleEntities }) => {
  const { user, visibleEntities } = props
  const visible = (e?: { type: 'collection' | 'global'; slug: string }) => {
    if (!e || !visibleEntities) return true
    const list: string[] = e.type === 'collection' ? visibleEntities.collections : visibleEntities.globals
    return list.includes(e.slug)
  }
  // заголовок группы показываем у первого видимого пункта группы
  const items: { label: string; href: string; icon: string; group?: string }[] = []
  let pendingGroup: string | undefined
  for (const item of NAV_ITEMS) {
    if (item.group) pendingGroup = item.group
    if (!visible(item.entity)) continue
    items.push({ label: item.label, href: item.href, icon: item.icon, group: pendingGroup })
    pendingGroup = undefined
  }
  const u = user as { name?: string; email?: string; role?: string } | null | undefined
  const name = u?.name || u?.email || ''
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return <NavClient items={items} user={{ name, initials, role: ROLE_LABELS[u?.role ?? ''] ?? '' }} />
}
