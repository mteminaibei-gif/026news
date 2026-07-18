'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const JOURNALIST_NAV = [
  { href: '/journalist/profile', label: 'Profile', icon: '📊' },
  { href: '/journalist/articles', label: 'My Articles', icon: '📝' },
  { href: '/journalist/create', label: 'New Article', icon: '➕' },
  { href: '/journalist/earnings', label: 'Earnings', icon: '💰' },
  { href: '/journalist/analytics', label: 'Analytics', icon: '📈' },
  { href: '/journalist/subscribers', label: 'Subscribers', icon: '👥' },
] as const

export function JournalistSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden lg:block w-64 flex flex-col"
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            N
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 20,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            026<span style={{ color: 'var(--primary)' }}>connet!</span>
          </span>
        </Link>
        <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Journalist Portal
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {JOURNALIST_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/journalist/profile' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-muted)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <Link
          href="/journalist/profile?logout=true"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-center w-full transition-all"
          style={{ color: 'var(--error)', background: 'var(--error-light)' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          <span aria-hidden="true">🚪</span>
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  )
}