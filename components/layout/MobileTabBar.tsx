'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
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
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  const scrollThreshold = 10

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      const diff = currentY - lastScrollY.current
      
      if (Math.abs(diff) < scrollThreshold) return
      
      if (diff > 0 && currentY > 100) {
        setVisible(false)
      } else {
        setVisible(true)
      }
      
      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav 
      className="mobile-tabbar" 
      aria-label="Mobile navigation"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-out',
      }}
    >
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
