'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Bookmark, Heart, MessageSquare, Bell, Settings, LayoutDashboard, PenLine, FileText, BarChart3, Users, ChevronLeft } from 'lucide-react'

interface ProfileNavProps {
  role: 'reader' | 'journalist' | 'admin'
  userId?: number
}

export function ProfileNav({ role, userId }: ProfileNavProps) {
  const pathname = usePathname()

  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { href: '/admin/profile', label: 'My Profile', icon: User },
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/articles', label: 'Articles', icon: FileText },
        { href: '/admin/write', label: 'Write', icon: PenLine },
        { href: '/admin/reviews', label: 'Reviews', icon: BarChart3 },
        { href: '/admin/journalists', label: 'Authors', icon: Users },
        { href: '/admin/notifications', label: 'Notifications', icon: Bell },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
      ]
    }
    if (role === 'journalist') {
      return [
        { href: `/journalists/${userId}`, label: 'Public Profile', icon: User },
        { href: '/journalist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/journalist/create', label: 'Write Article', icon: PenLine },
        { href: '/journalist/articles', label: 'My Articles', icon: FileText },
        { href: '/journalist/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/journalist/earnings', label: 'Earnings', icon: BarChart3 },
        { href: '/inbox', label: 'Messages', icon: MessageSquare },
        { href: '/notifications', label: 'Notifications', icon: Bell },
        { href: '/settings', label: 'Settings', icon: Settings },
      ]
    }
    // reader
    return [
      { href: '/profile', label: 'My Profile', icon: User },
      { href: '/saved', label: 'Saved Articles', icon: Bookmark },
      { href: '/inbox', label: 'Messages', icon: MessageSquare },
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  }

  const items = getNavItems()
  const homeHref = role === 'admin' ? '/admin/dashboard' : role === 'journalist' ? '/journalist/dashboard' : '/'

  return (
    <nav style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14,
      padding: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      <Link
        href={homeHref}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 10,
          fontSize: '0.82rem', fontWeight: 500,
          color: 'var(--text-tertiary)',
          textDecoration: 'none',
          transition: 'all 0.15s',
        }}
      >
        <ChevronLeft size={14} />
        Back to {role === 'admin' ? 'Dashboard' : role === 'journalist' ? 'Dashboard' : 'Home'}
      </Link>
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href.split('?')[0]))
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              fontSize: '0.82rem', fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={15} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
