'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Compass, MessageSquare, Newspaper,
} from 'lucide-react'

const ITEMS: { href: string; label: string; icon: typeof Home; match: (p: string) => boolean; badge?: boolean }[] = [
  { href: '/social', label: 'Social', icon: Home, match: (p: string) => p.startsWith('/social') },
  { href: '/explore', label: 'Explore', icon: Compass, match: (p: string) => p.startsWith('/explore') },
  { href: '/inbox', label: 'Messages', icon: MessageSquare, match: (p: string) => p.startsWith('/inbox'), badge: true },
  { href: '/news', label: 'News', icon: Newspaper, match: (p: string) => p.startsWith('/news') },
]

export function MobileTabBar() {
  const pathname = usePathname() ?? ''

  return (
    <nav className="mobile-tabbar" aria-label="Mobile navigation">
      {ITEMS.map(({ href, label, icon: Icon, match, badge }) => {
        const active = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon />
              {badge && (
                <span style={{
                  position: 'absolute', top: -4, right: -6,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--grad-accent)',
                  border: '2px solid var(--glass-bg-strong)',
                }} />
              )}
            </div>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
