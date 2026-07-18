'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ADMIN_NAV: { section: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    section: 'Manage',
    items: [
      { href: '/admin/profile', label: 'Overview', icon: '🎨' },
      { href: '/admin/articles', label: 'Articles', icon: '📝' },
      { href: '/admin/journalists', label: 'Authors', icon: '👥' },
      { href: '/admin/users', label: 'Users', icon: '👤' },
      { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
      { href: '/admin/sources', label: 'Sources', icon: '🔗' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: '📊' },
      { href: '/admin/earnings', label: 'Earnings', icon: '💰' },
      { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
      { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
    ],
  },
  {
    section: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
]

export function AdminSidebar() {
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
          Admin Dashboard
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {ADMIN_NAV.map((group) => (
          <div key={group.section}>
            <p
              className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {group.section}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin/profile' && pathname.startsWith(item.href))
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
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <Link
          href="/admin/profile?logout=true"
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