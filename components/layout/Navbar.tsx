'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Moon, Sun, Search, Menu, X, LayoutDashboard, LogOut, User, Bell, Radio, Newspaper, Compass, FileText, PenLine, MessageSquare, Tv, Trophy, Bookmark, Settings } from 'lucide-react'
import { useUser, useProfile, useSignOut } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages'
import { NavbarNotificationDropdown } from '@/components/layout/NavbarNotificationDropdown'
import { MessagePopout } from '@/components/layout/MessagePopout'
import { NAV_LINKS } from '@/lib/constants/navigation'
import { Logo } from '@/components/layout/Logo'

const NAVBAR_H = 64

// Links shown in a second section of the mobile drawer (not in the top-level
// nav). Kept here so the hamburger menu exposes the full site, not just the
// primary categories.
const MOBILE_SECONDARY_LINKS: { href: string; label: string; Icon: typeof Compass }[] = [
  { href: '/journalists', label: 'Authors', Icon: PenLine },
  { href: '/rankings', label: 'Rankings', Icon: Trophy },
  { href: '/saved', label: 'Saved', Icon: Bookmark },
  { href: '/profile', label: 'My Profile', Icon: User },
  { href: '/settings', label: 'Settings', Icon: Settings },
]

export function Navbar() {
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const searchInputRef                  = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router   = useRouter()
  const { darkMode, toggleDarkMode } = useTheme()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  const signOutMutation = useSignOut()
  const { unreadCount } = useNotifications(profile?.user_id ?? 0, (profile?.role as 'admin' | 'journalist' | 'reader') ?? 'reader')
  const { unread: unreadMessages } = useUnreadMessages()
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileOpen(false)
      setSearchOpen(false)
    }
  }, [])
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const closeMobile = useCallback(() => setMobileOpen(false), [])



  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
        setSearchOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
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
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop nav */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-8" aria-label="Main navigation">
            {NAV_LINKS.filter(l => l.href !== '/inbox' || user).map(link => {
              const href = link.href as string
              const isActive =
                href === '/'
                  ? pathname === '/' && !href.includes('category')
                  : pathname?.startsWith(href.split('?')[0]) && href !== '/'
              const Icon = href === '/' ? Compass
                : href === '/sources' ? Compass
                : href === '/news' ? Newspaper
                : href === '/articles' ? FileText
                : href === '/radio' ? Radio
                : href === '/tv' ? Tv
                : href === '/journalists' ? PenLine
                : href === '/inbox' ? MessageSquare
                : null
               return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'nav-link text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 rounded-md px-2 py-1.5',
                    isActive ? 'active font-semibold' : 'hover:opacity-100'
                  )}
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {Icon && (
                    href === '/inbox' ? (
                      <span style={{ position: 'relative', display: 'inline-flex' }}>
                        <MessageSquare size={15} />
                        {unreadMessages > 0 && (
                          <span style={{
                            position: 'absolute', top: -6, right: -8,
                            minWidth: 16, height: 16, borderRadius: 8,
                            background: 'var(--error)', color: '#fff',
                            fontSize: '0.6rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '0 4px', border: '2px solid var(--nav-bg)',
                          }}>
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                          </span>
                        )}
                      </span>
                    ) : (
                      <Icon size={15} style={href === '/radio' ? { color: '#ef4444' } : href === '/tv' ? { color: '#3b82f6' } : undefined} />
                    )
                  )}
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search */}
            {searchOpen ? (
              <form
                className="relative animate-fade-in"
                onSubmit={e => {
                  e.preventDefault()
                  const q = searchQuery.trim()
                  if (q) {
                    router.push(`/search?q=${encodeURIComponent(q)}`)
                    setSearchOpen(false)
                    setSearchQuery('')
                  }
                }}
              >
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  ref={searchInputRef}
                  autoFocus
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  aria-label="Search articles"
                  onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                  className="pl-9 pr-4 py-2 rounded-lg text-sm font-medium w-56 transition-all duration-200"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="icon-btn hover:shadow-[0_0_18px_-4px_var(--primary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                style={{
                  width: 44, height: 44, borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s var(--ease-out-expo)',
                }}
              >
                <Search size={18} />
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="hover:shadow-[0_0_18px_-4px_var(--primary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              style={{
                width: 40, height: 40, borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s var(--ease-out-expo)',
              }}
            >
              {darkMode ? <Sun size={16} style={{ color: 'var(--text-primary)' }} /> : <Moon size={16} style={{ color: 'var(--text-primary)' }} />}
            </button>

            {/* Notification bell (authenticated) — dropdown */}
            {!userLoading && user && profile && (
              <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen)
                    }}
                    aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      transition: 'all 0.2s',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        minWidth: 16, height: 16, borderRadius: 8,
                        background: 'var(--error)',
                        color: '#fff',
                        fontSize: '0.6rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 4px',
                        border: '2px solid var(--bg-surface)',
                      }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <>
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                        onClick={() => setNotifOpen(false)}
                      />
                      <NavbarNotificationDropdown
                        userId={profile?.user_id ?? 0}
                        role={(profile?.role as 'admin' | 'journalist' | 'reader') ?? 'reader'}
                        onClose={() => setNotifOpen(false)}
                      />
</>
                  )}
                  </div>
                )}

            {/* Message popout (authenticated) */}
            {!userLoading && user && profile && (
              <MessagePopout />
            )}

            {/* Auth states */}
{!userLoading && (
                user ? (
                  <>
                  <div className="flex items-center gap-2">
                    <Link
                      href={profile?.role === 'admin' ? '/profile' : profile?.role === 'journalist' ? `/journalists/${profile?.user_id}` : '/profile'}
                      style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: profile?.profile_image ? 'transparent' : 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--bg-elevated)',
                        fontSize: '0.8rem', fontWeight: 700,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                    >
                      {profile?.profile_image ? (
                        <img
                          src={profile.profile_image}
                          alt={profile?.name ?? 'Profile'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                      ) : (
                        profile?.name?.charAt(0).toUpperCase() ?? <User size={16} />
                      )}
                    </Link>
                    <button
                      onClick={() => signOutMutation.mutate()}
                      title="Sign out"
                      aria-label="Sign out"
                      className="hidden sm:flex items-center justify-center"
                      style={{
                        width: 44, height: 44, borderRadius: 10,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                  </>
                ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="nav-btn nav-btn-ghost"
                    style={{
                      padding: '8px 18px', borderRadius: 8,
                      fontSize: '0.85rem', fontWeight: 600,
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.2s var(--ease-out-expo)',
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/onboarding"
                    className="nav-btn nav-btn-primary"
                    style={{
                      padding: '8px 18px', borderRadius: 8,
                      fontSize: '0.85rem', fontWeight: 600,
                      background: 'var(--primary)',
                      border: '1px solid var(--primary)',
                      color: 'var(--bg-elevated)',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.2s var(--ease-out-expo)',
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden flex items-center justify-center"
              style={{
                width: 40, height: 40, borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={cn(
          'lg:hidden fixed inset-0 z-40 transition-opacity duration-300',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{
          top: NAVBAR_H,
          background: 'oklch(0% 0 0 / 0.4)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Mobile drawer */}
      <nav
        id="mobile-nav"
        aria-label="Mobile navigation"
        className={cn(
          'lg:hidden fixed right-0 z-50 flex flex-col overflow-y-auto overscroll-contain',
          mobileOpen ? 'flex' : 'hidden'
        )}
        style={{
          width: 320, maxWidth: '85vw',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-xl)',
          top: NAVBAR_H,
          height: `calc(100dvh - ${NAVBAR_H}px)`,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s var(--ease-out-expo)',
        }}
      >
        <div className="flex-1 p-5">
          <p style={{
            fontSize: '0.65rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--text-tertiary)', marginBottom: 12,
          }}>
            News Categories
          </p>
          <ul className="space-y-1" role="list">
            {NAV_LINKS.filter(l => l.href !== '/inbox' || user).map(link => {
              const href = link.href as string
              const Icon = href === '/' ? Compass
                : href === '/sources' ? Compass
                : href === '/news' ? Newspaper
                : href === '/articles' ? FileText
                : href === '/radio' ? Radio
                : href === '/tv' ? Tv
                : href === '/journalists' ? PenLine
                : href === '/inbox' ? MessageSquare
                : null
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[var(--primary-light)] hover:shadow-[0_0_20px_-4px_var(--primary)]"
                    style={{
                      color: pathname === href ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: pathname === href ? 'var(--primary-light)' : 'transparent',
                    }}
                  >
                    {Icon && (
                      href === '/inbox' ? (
                        <span style={{ position: 'relative', display: 'inline-flex' }}>
                          <MessageSquare size={16} />
                          {unreadMessages > 0 && (
                            <span style={{
                              position: 'absolute', top: -4, right: -8,
                              minWidth: 16, height: 16, borderRadius: 8,
                              background: 'var(--error)', color: '#fff',
                              fontSize: '0.6rem', fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: '0 4px', border: '2px solid var(--bg-surface)',
                            }}>
                              {unreadMessages > 99 ? '99+' : unreadMessages}
                            </span>
                          )}
                        </span>
                      ) : (
                        <Icon size={16} style={href === '/radio' ? { color: '#ef4444' } : href === '/tv' ? { color: '#3b82f6' } : undefined} />
                      )
                    )}
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <p style={{
            fontSize: '0.65rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--text-tertiary)', margin: '20px 0 12px',
          }}>
            More
          </p>
          <ul className="space-y-1" role="list">
            {MOBILE_SECONDARY_LINKS.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[var(--primary-light)] hover:shadow-[0_0_20px_-4px_var(--primary)]"
                  style={{
                    color: pathname === href ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: pathname === href ? 'var(--primary-light)' : 'transparent',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 pt-4 space-y-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {user ? (
            <>
              <Link
                href={profile?.role === 'admin' ? '/profile' : profile?.role === 'journalist' ? `/journalists/${profile?.user_id}` : '/profile'}
                onClick={closeMobile}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: profile?.profile_image ? 'transparent' : 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--bg-elevated)', fontSize: '0.8rem', fontWeight: 700,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {profile?.profile_image ? (
                    <img
                      src={profile.profile_image}
                      alt={profile?.name ?? 'Profile'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    profile?.name?.charAt(0).toUpperCase() ?? '?'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{profile?.name ?? 'Account'}</p>
                  <p className="text-xs font-medium capitalize" style={{ color: 'var(--primary)' }}>{profile?.role === 'journalist' ? 'Author' : (profile?.role ?? 'Reader')}</p>
                </div>
              </Link>

              <button
                onClick={() => { closeMobile(); signOutMutation.mutate() }}
                className="flex items-center justify-center gap-2 w-full text-sm font-semibold py-3 rounded-xl transition-all"
                style={{
                  background: 'var(--error-light)', color: 'var(--error)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={closeMobile}
                className="flex items-center justify-center w-full text-sm font-semibold py-3.5 rounded-xl transition-all"
                style={{
                  color: 'var(--text-primary)',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
              <Link
                href="/onboarding"
                onClick={closeMobile}
                className="flex items-center justify-center gap-2 w-full text-sm font-semibold py-3.5 rounded-xl transition-all"
                style={{
                  background: 'var(--primary)', color: 'var(--bg-elevated)',
                  textDecoration: 'none',
                }}
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  )
}
