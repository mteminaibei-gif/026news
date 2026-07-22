'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Moon, Sun, Search, Menu, Bell, LogOut, User, Users, Compass, Newspaper, FileText, Radio, Tv, LogIn, UserPlus } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useUser, useProfile, useSignOut } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { NavbarNotificationDropdown } from '@/components/layout/NavbarNotificationDropdown'
import { MessagePopout } from '@/components/layout/MessagePopout'

const NAV_ITEMS = [
  { href: '/social', label: 'Social', Icon: Users, match: (p: string) => p.startsWith('/social') },
  { href: '/explore', label: 'Explore', Icon: Compass, match: (p: string) => p.startsWith('/explore') || p.startsWith('/category') },
  { href: '/news', label: 'News', Icon: Newspaper, match: (p: string) => p.startsWith('/news') },
  { href: '/articles', label: 'Articles', Icon: FileText, match: (p: string) => p.startsWith('/articles') },
  { href: '/radio', label: 'Radio', Icon: Radio, match: (p: string) => p.startsWith('/radio') },
  { href: '/tv', label: 'TV', Icon: Tv, match: (p: string) => p.startsWith('/tv') },
]

export function Navbar({ onMenu }: { onMenu: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { darkMode, toggleDarkMode } = useTheme()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  const signOutMutation = useSignOut()
  const { unreadCount } = useNotifications(profile?.user_id ?? 0, (profile?.role as 'admin' | 'journalist' | 'reader') ?? 'reader')
  const [notifOpen, setNotifOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setSearchOpen(false)
  }, [])
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: 'var(--glow-soft)',
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 grid" style={{ gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '0.5rem' }}>
        {/* Left: hamburger + brand */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMenu}
            aria-label="Open menu"
            className="md:hidden flex items-center justify-center shrink-0"
            style={{
              width: 36, height: 36, borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              cursor: 'pointer', color: 'var(--text-secondary)',
              transition: 'all var(--dur-fast) var(--ease-out-expo)',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <Menu size={16} />
          </button>

          <Link href="/" aria-label="026connet! home" className="shrink-0 inline-flex items-center">
            <Logo size="sm" href="" />
          </Link>
        </div>

        {/* Center: desktop nav links — visible for all users */}
        <nav className="hidden md:flex items-center justify-center gap-0.5" aria-label="Main navigation">
          {NAV_ITEMS.map(item => {
            const active = item.match(pathname)
            const isSamePage = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if (isSamePage) {
                    e.preventDefault()
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                className={`nav-tab-link ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <item.Icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: search + actions */}
        <div className="flex items-center gap-2 justify-end">
          {searchOpen ? (
            <form
              className="relative animate-fade-in"
              onSubmit={e => {
                e.preventDefault()
                const q = searchQuery.trim()
                if (q) { router.push(`/search?q=${encodeURIComponent(q)}`); setSearchOpen(false); setSearchQuery('') }
              }}
            >
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input
                ref={searchInputRef}
                autoFocus
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search news, people, topics…"
                aria-label="Search"
                onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                className="pl-9 pr-4 py-1.5 rounded-lg text-sm font-medium w-64 transition-all duration-200"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  backdropFilter: 'blur(8px)',
                  outline: 'none',
                  boxShadow: 'var(--glow-primary)',
                }}
              />
            </form>
          ) : (
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50) }}
              aria-label="Open search"
              className="hidden sm:flex shrink-0"
              style={{
                width: 36, height: 36, borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all var(--dur-fast) var(--ease-out-expo)',
                backdropFilter: 'blur(4px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <Search size={16} />
            </button>
          )}

          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 36, height: 36, borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', cursor: 'pointer',
              transition: 'all var(--dur-fast) var(--ease-out-expo)',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {!userLoading && user && profile && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative',
                  transition: 'all var(--dur-fast) var(--ease-out-expo)',
                  backdropFilter: 'blur(4px)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="notification-badge-pulse" style={{
                    position: 'absolute', top: 5, right: 5, minWidth: 15, height: 15, borderRadius: 8,
                    background: 'var(--grad-accent)',
                    color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', border: '2px solid var(--glass-bg-strong)',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NavbarNotificationDropdown userId={profile?.user_id ?? 0} role={(profile?.role as 'admin' | 'journalist' | 'reader') ?? 'reader'} onClose={() => setNotifOpen(false)} />
              )}
            </div>
          )}

          {!userLoading && user && profile && <MessagePopout />}

          {!userLoading && (
            user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href={profile?.role === 'admin' ? '/admin' : profile?.role === 'journalist' ? `/journalists/${profile?.user_id}` : '/social'}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: profile?.profile_image ? 'transparent' : 'var(--grad-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                    textDecoration: 'none', cursor: 'pointer', overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 0 0 2px var(--glass-bg-strong), 0 0 0 3px var(--glass-border)',
                    transition: 'box-shadow var(--dur-fast) var(--ease-out-expo)',
                  }}
                  aria-label="Your account"
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--glass-bg-strong), 0 0 0 3px var(--glass-border)' }}
                >
                  {profile?.profile_image
                    ? <img src={profile.profile_image} alt={profile?.name ?? 'Profile'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : (profile?.name?.charAt(0).toUpperCase() ?? <User size={15} />)}
                  {/* Online indicator */}
                  <span style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#22c55e',
                    border: '2px solid var(--glass-bg-strong)',
                  }} />
                </Link>
                <button
                  onClick={() => signOutMutation.mutate()}
                  title="Sign out"
                  aria-label="Sign out"
                  className="flex items-center justify-center"
                  style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                    transition: 'all var(--dur-fast) var(--ease-out-expo)',
                    backdropFilter: 'blur(4px)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--glass-bg)' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="navbar-auth-btn"
                  title="Sign In"
                  aria-label="Sign In"
                >
                  <LogIn size={16} />
                  <span className="navbar-auth-label">Sign In</span>
                </Link>
                <Link
                  href="/onboarding"
                  className="navbar-auth-btn primary"
                  title="Sign Up"
                  aria-label="Sign Up"
                >
                  <UserPlus size={16} />
                  <span className="navbar-auth-label">Sign Up</span>
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  )
}
