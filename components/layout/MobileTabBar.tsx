'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Compass, MessageSquare, User, Newspaper,
} from 'lucide-react'

const ITEMS = [
  { href: '/social', label: 'Social', icon: Home, match: (p: string) => p.startsWith('/social') },
  { href: '/explore', label: 'Explore', icon: Compass, match: (p: string) => p.startsWith('/explore') },
  { href: '/inbox', label: 'Messages', icon: MessageSquare, match: (p: string) => p.startsWith('/inbox') },
  { href: '/news', label: 'News', icon: Newspaper, match: (p: string) => p.startsWith('/news') },
] as const

export function MobileTabBar() {
  const pathname = usePathname() ?? ''

  return (
    <nav className="mobile-tabbar" aria-label="Mobile navigation">
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
          >
            <Icon />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
