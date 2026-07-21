'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Moon, Sun, Search, Menu, Bell, LogOut, User, Users, Compass, Newspaper, FileText, Radio, Tv } from 'lucide-react'
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
      className="sticky top-0 z-50 border-b transition-all duration-300"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'var(--border-subtle)',
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
              width: 36, height: 36, borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              cursor: 'pointer', color: 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            <Menu size={16} />
          </button>

          <Link href="/" aria-label="026connet! home" className="shrink-0 inline-flex items-center">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Center: desktop nav links — only for logged-out visitors */}
        {!user && (
          <nav className="hidden md:flex items-center justify-center gap-0.5" aria-label="Main navigation">
            {NAV_ITEMS.map(item => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-tab-link ${active ? 'active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <item.Icon size={15} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}

        {/* Center spacer when logged in (keeps logo left, actions right) */}
        {user && <div />}

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
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="hover:shadow-[0_0_18px_-4px_var(--primary)] hover:border-[var(--primary)] hover:text-[var(--primary)] hidden sm:flex shrink-0"
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-surface)',
                alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Search size={16} />
            </button>
          )}

          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="hover:shadow-[0_0_18px_-4px_var(--primary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {darkMode ? <Sun size={15} style={{ color: 'var(--text-primary)' }} /> : <Moon size={15} style={{ color: 'var(--text-primary)' }} />}
          </button>

          {!userLoading && user && profile && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 5, right: 5, minWidth: 15, height: 15, borderRadius: 8, background: 'var(--error)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '2px solid var(--bg-surface)' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setNotifOpen(false)} />
                  <NavbarNotificationDropdown userId={profile?.user_id ?? 0} role={(profile?.role as 'admin' | 'journalist' | 'reader') ?? 'reader'} onClose={() => setNotifOpen(false)} />
                </>
              )}
            </div>
          )}

          {!userLoading && user && profile && <MessagePopout />}

          {!userLoading && (
            user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href={profile?.role === 'admin' ? '/admin' : profile?.role === 'journalist' ? `/journalists/${profile?.user_id}` : '/social'}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: profile?.profile_image ? 'transparent' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-elevated)', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', cursor: 'pointer', overflow: 'hidden' }}
                  aria-label="Your account"
                >
                  {profile?.profile_image
                    ? <img src={profile.profile_image} alt={profile?.name ?? 'Profile'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : (profile?.name?.charAt(0).toUpperCase() ?? <User size={15} />)}
                </Link>
                <button onClick={() => signOutMutation.mutate()} title="Sign out" aria-label="Sign out" className="hidden sm:flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" style={{ height: 34, padding: '0 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Sign In</Link>
                <Link href="/onboarding" style={{ height: 34, padding: '0 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, background: 'var(--primary)', border: '1px solid var(--primary)', color: 'var(--bg-elevated)', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Sign Up</Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  )
}
