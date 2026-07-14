'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, PenLine, Newspaper, TrendingUp, Users, User,
  Settings, Globe, BarChart3, Wallet, Home, FileText, Mail, Bell
} from 'lucide-react'

interface NavItem { href: string; label: string; icon: React.ReactNode }
interface SidebarProps {
  role: 'journalist' | 'admin'
  user: { name: string; profile_image: string | null }
}

const JOURNALIST_NAV: NavItem[] = [
  { href: '/journalist/dashboard',   label: 'Dashboard',   icon: <LayoutDashboard size={18} /> },
  { href: '/journalist/create',      label: 'Write Article', icon: <PenLine size={18} /> },
  { href: '/journalist/articles',    label: 'My Articles', icon: <Newspaper size={18} /> },
  { href: '/journalist/analytics',   label: 'Analytics',   icon: <BarChart3 size={18} /> },
  { href: '/journalist/earnings',    label: 'Earnings',    icon: <Wallet size={18} /> },
  { href: '/journalist/subscribers', label: 'Subscribers', icon: <Users size={18} /> },
  { href: '/journalist/profile',     label: 'Profile',     icon: <User size={18} /> },
]
const ADMIN_NAV: NavItem[] = [
  { href: '/admin/dashboard',      label: 'Dashboard',      icon: <LayoutDashboard size={18} /> },
  { href: '/admin/write',          label: 'Write',          icon: <PenLine size={18} /> },
  { href: '/admin/articles',       label: 'Articles',       icon: <Newspaper size={18} /> },
  { href: '/admin/reviews',        label: 'Reviews',        icon: <FileText size={18} /> },
  { href: '/admin/journalists',    label: 'Authors',        icon: <Users size={18} /> },
  { href: '/admin/notifications',  label: 'Notifications',  icon: <Bell size={18} /> },
  { href: '/admin/sources',        label: 'Sources',        icon: <Globe size={18} /> },
  { href: '/admin/users',          label: 'Users',          icon: <Users size={18} /> },
  { href: '/admin/analytics',      label: 'Analytics',      icon: <TrendingUp size={18} /> },
  { href: '/admin/earnings',       label: 'Earnings',       icon: <Wallet size={18} /> },
  { href: '/admin/gmail',          label: 'Gmail Inbox',    icon: <Mail size={18} /> },
  { href: '/admin/settings',       label: 'Settings',       icon: <Settings size={18} /> },
]

export function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname()
  const navItems = role === 'journalist' ? JOURNALIST_NAV : ADMIN_NAV
  const tagline = role === 'journalist' ? 'Author Portal' : 'Admin Panel'

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setIsCollapsed(window.innerWidth < 1200)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sidebarWidth = isCollapsed ? 64 : 260

  return (
    <>
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'oklch(0% 0 0 / 0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className="flex flex-col fixed top-0 left-0 h-screen z-40 overflow-hidden transition-all duration-300"
        style={{
          width: sidebarWidth,
          background: 'var(--sidebar-bg)',
          padding: '24px 16px',
          transform: isMobile && isCollapsed ? 'translateX(-100%)' : 'none',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between mb-2" style={{ padding: '0 12px' }}>
          <Link href="/" aria-label="026NEWS home" className="flex items-center gap-2 no-underline">
            {!isCollapsed && (
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                 026<span style={{ color: '#e23b3b' }}>News</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>

        {!isCollapsed && (
          <p style={{
            fontSize: '0.65rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--accent)', padding: '0 12px',
            marginBottom: 32,
          }}>
            {tagline}
          </p>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="mb-6">
            {!isCollapsed && (
              <p style={{
                fontSize: '0.65rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-tertiary)', padding: '0 12px',
                marginBottom: 8,
              }}>
                Menu
              </p>
            )}
            <ul className="flex flex-col gap-0.5 list-none">
              {navItems.map(item => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        padding: '10px 12px',
                        color: isActive ? 'var(--text-primary)' : 'var(--sidebar-text)',
                        background: isActive ? 'var(--sidebar-active)' : 'transparent',
                        textDecoration: 'none',
                      }}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>
                        {item.icon}
                      </span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            {!isCollapsed && (
              <p style={{
                fontSize: '0.65rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-tertiary)', padding: '0 12px',
                marginBottom: 8,
              }}>
                Quick Links
              </p>
            )}
            <ul className="flex flex-col gap-0.5 list-none">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{ padding: '10px 12px', color: 'var(--sidebar-text)', textDecoration: 'none' }}
                  title={isCollapsed ? 'View Site' : undefined}
                >
                  <Home size={18} style={{ opacity: 0.7, flexShrink: 0 }} />
                  {!isCollapsed && <span>View Site</span>}
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* User section */}
        <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '1px solid oklch(25% 0.015 175)' }}>
          <div className="flex items-center gap-2.5">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--bg-elevated)', fontSize: '0.8rem', fontWeight: 700,
              flexShrink: 0,
            }}>
              {user.profile_image ? (
                <Image
                  src={user.profile_image}
                  alt={user.name}
                  width={36}
                  height={36}
                  className="rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>{role === 'journalist' ? 'Author' : 'Admin'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
