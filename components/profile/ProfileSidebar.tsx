'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Bookmark, BarChart3, MessageSquare, Settings, LayoutDashboard, PenTool, FileText, Users } from 'lucide-react'

interface ProfileSidebarProps {
  role: string
}

export function ProfileSidebar({ role }: ProfileSidebarProps) {
  const pathname = usePathname()

  const getGroups = () => {
    const groups = [
      {
        section: 'My Account',
        items: [
          { href: '/profile', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { href: '/saved', label: 'Saved Articles', icon: <Bookmark size={18} /> },
          { href: '/stats', label: 'Reading Stats', icon: <BarChart3 size={18} /> },
        ]
      },
      {
        section: 'Communication',
        items: [
          { href: '/inbox', label: 'Messages', icon: <MessageSquare size={18} /> },
          { href: '/settings', label: 'Settings', icon: <Settings size={18} /> },
        ]
      }
    ]

    if (role === 'journalist') {
      groups.push({
        section: 'Studio',
        items: [
          { href: '/journalist/create', label: 'Write Article', icon: <PenTool size={18} /> },
          { href: '/journalist/articles', label: 'My Articles', icon: <FileText size={18} /> },
          { href: '/journalist/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
          { href: '/journalist/earnings', label: 'Earnings', icon: <BarChart3 size={18} /> },
        ]
      })
    }

    if (role === 'admin') {
      groups.push({
        section: 'Administration',
        items: [
          { href: '/admin/articles', label: 'Articles', icon: <FileText size={18} /> },
          { href: '/admin/write', label: 'Write', icon: <PenTool size={18} /> },
          { href: '/admin/reviews', label: 'Reviews', icon: <BarChart3 size={18} /> },
          { href: '/admin/journalists', label: 'Authors', icon: <Users size={18} /> },
          { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
        ]
      })
    }

    return groups
  }

  const navGroups = getGroups()

  return (
    <aside
      className="hidden lg:flex w-64 flex-col"
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
          User Profile
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.section}>
            <p
              className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {group.section}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
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
                      if (!isActive) e.currentTarget.style.background = 'var(--bg-inset)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span aria-hidden="true" style={{ display: 'flex', opacity: isActive ? 1 : 0.7 }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <Link
          href="/profile?logout=true"
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all"
          style={{ color: 'var(--error)', background: 'var(--error-light)' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          Logout
        </Link>
      </div>
    </aside>
  )
}
