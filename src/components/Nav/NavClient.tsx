'use client'

import { useNav } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type Item = { label: string; href: string; icon: string; group?: string }

const Icon = ({ d }: { d: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

export const NavClient = ({ items, user }: { items: Item[]; user: { name: string; initials: string; role: string } }) => {
  const { navOpen, navRef, hydrated } = useNav()
  const pathname = usePathname() ?? ''
  // на широком экране меню всегда открыто, как в макете; на узком — по кнопке
  const [desktop, setDesktop] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1025px)')
    const update = () => setDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  const open = navOpen || desktop
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`))

  return (
    <aside className={['nav', 'jet-nav', open && 'nav--nav-open', hydrated && 'nav--nav-hydrated'].filter(Boolean).join(' ')} inert={!open ? true : undefined}>
      <div className="nav__scroll" ref={navRef}>
        <nav className="jet-nav__wrap" aria-label="Разделы админки">
          <div className="jet-nav__brand">
            <svg viewBox="0 0 52 52" width="36" height="36" aria-hidden="true">
              <path d="M6.70476 33.5671C5.11164 31.4612 4.00392 28.9287 4.00001 26.0947C3.99609 22.932 5.31909 20.1215 7.28799 17.9295C13.5939 10.9111 21.9902 5.74817 31.7916 4.16287C34.4533 3.7323 37.2794 4.13939 39.8002 5.57594C42.321 7.0164 44.0904 9.2319 45.0415 11.7253C48.5527 20.9122 48.2278 30.6823 45.2333 39.5912C44.2978 42.3743 42.5011 44.9108 39.7259 46.4882C37.2403 47.9013 34.4729 48.1753 31.8268 47.9091C22.9727 47.0088 12.1378 40.746 6.70476 33.5671Z" fill="#0032AD" />
            </svg>
            <span className="jet-nav__brand-name">
              Инфосистемы
              <br />
              Джет
            </span>
            <span className="jet-nav__cms">CMS</span>
          </div>
          <div className="jet-nav__list">
            {items.map((item) => (
              <div key={item.href}>
                {item.group && <div className="jet-nav__group">{item.group}</div>}
                <Link href={item.href} className={['jet-nav__link', isActive(item.href) && 'jet-nav__link--active'].filter(Boolean).join(' ')} prefetch={false}>
                  <Icon d={item.icon} />
                  <span>{item.label}</span>
                </Link>
              </div>
            ))}
          </div>
          <div className="jet-nav__user">
            <Link href="/admin/account" className="jet-nav__avatar" aria-label="Мой профиль">
              {user.initials || '?'}
            </Link>
            <Link href="/admin/account" className="jet-nav__who">
              <span>{user.name}</span>
              <span className="jet-nav__role">{user.role}</span>
            </Link>
            <Link href="/admin/logout" className="jet-nav__logout" aria-label="Выйти" prefetch={false}>
              <Icon d="M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10" />
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  )
}
