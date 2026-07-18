'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Compass, Search, User, Newspaper,
} from 'lucide-react'

const ITEMS = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/explore', label: 'Explore', icon: Compass, match: (p: string) => p.startsWith('/explore') },
  { href: '/search', label: 'Search', icon: Search, match: (p: string) => p.startsWith('/search') },
  { href: '/news', label: 'News', icon: Newspaper, match: (p: string) => p.startsWith('/news') },
  { href: '/profile', label: 'Profile', icon: User, match: (p: string) => p.startsWith('/profile') || p.startsWith('/stats') },
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
