'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Moon, Sun, Search, Menu, X, LayoutDashboard, LogOut, User } from 'lucide-react'
import { useUser, useProfile, useSignOut } from '@/lib/hooks/useAuth'

const NAV_LINKS = [
  { href: '/',                   label: 'Home' },
  { href: '/?category=Kenya',    label: '🇰🇪 Kenya' },
  { href: '/?category=Africa',   label: '🌍 Africa' },
  { href: '/?category=Politics', label: 'Politics' },
  { href: '/?category=Business', label: 'Business' },
  { href: '/?category=Tech',     label: 'Tech' },
  { href: '/?category=Sports',   label: 'Sports' },
  { href: '/?category=Health',   label: 'Health' },
  { href: '/journalists',        label: 'Authors' },
]

// Navbar height in px — must match h-20 (80px) + kenya-bar (3px)
const NAVBAR_H = 83

export function Navbar() {
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [scrolled,     setScrolled]     = useState(false)
  const searchInputRef                  = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router   = useRouter()
  const { darkMode, toggleDarkMode } = useTheme()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  const signOutMutation = useSignOut()

  // Close drawer on route change
  useEffect(() => { 
    const closeMobileNav = () => setMobileOpen(false)
    closeMobileNav()
  }, [pathname])

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Add shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close on Escape key
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

  return (
    <>
      <header
        role="banner"
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          'bg-white dark:bg-[#162319] backdrop-blur-xl',
          scrolled
            ? 'shadow-[0_4px_24px_rgba(26,92,42,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'shadow-none'
        )}
      >
        {/* Kenya flag stripe */}
        <div className="kenya-bar" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link href="/" aria-label="026NEWS — home" className="shrink-0 group">
            <Image
              src="/logo.svg"
              alt="026NEWS"
              width={280}
              height={80}
              priority
              className="h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(link => {
              const isActive =
                link.href === '/'
                  ? pathname === '/' && !link.href.includes('category')
                  : pathname?.startsWith(link.href.split('?')[0]) && link.href !== '/'
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'nav-link px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300',
                    isActive
                      ? 'active text-[#1a5c2a] dark:text-[#4caf28] bg-[#f0faf2] dark:bg-[#1a5c2a]/15'
                      : 'text-gray-600 dark:text-gray-300 hover:text-[#1a5c2a] dark:hover:text-[#4caf28] hover:bg-[#f0faf2] dark:hover:bg-[#1a5c2a]/15'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-2 shrink-0">

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
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a5c2a]" />
                <input
                  ref={searchInputRef}
                  autoFocus
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Kenya news…"
                  aria-label="Search articles"
                  onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                  className="pl-8 pr-4 py-2 rounded-full text-sm bg-[#f0faf2] dark:bg-[#162319] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4caf28]/40 w-52 transition-all duration-300"
                />
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="p-2 rounded-xl text-[#1a5c2a] dark:text-[#4caf28] hover:bg-[#f0faf2] dark:hover:bg-[#1a5c2a]/20 transition-all duration-300"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={cn(
                'relative flex items-center h-7 w-12 rounded-full p-1 transition-all duration-300',
                darkMode ? 'bg-[#1a5c2a]' : 'bg-[#e8f5ea]'
              )}
            >
              <span className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full shadow transition-all duration-300',
                darkMode ? 'translate-x-5 bg-[#f5c518]' : 'translate-x-0 bg-[#1a5c2a]'
              )}>
                {darkMode
                  ? <Moon size={10} className="text-[#1a1a1a]" />
                  : <Sun  size={10} className="text-white" />
                }
              </span>
            </button>

            {/* Auth states — desktop */}
            {!userLoading && (
              user ? (
                <div className="hidden sm:flex items-center gap-2">
                  {(profile?.role === 'admin' || profile?.role === 'journalist') && (
                    <Link
                      href={profile.role === 'admin' ? '/admin/dashboard' : '/journalist/dashboard'}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#1a5c2a] hover:bg-[#2d8a47] px-3 py-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                      <LayoutDashboard size={13} />
                      {profile.role === 'admin' ? 'Admin' : 'Writer'}
                    </Link>
                  )}
                  <div className="flex items-center gap-1.5 ml-1">
                    <div className="w-8 h-8 rounded-full bg-[#e8f5ea] dark:bg-[#1a5c2a]/50 text-[#1a5c2a] dark:text-[#4caf28] flex items-center justify-center font-bold text-sm select-none">
                      {profile?.name?.charAt(0).toUpperCase() ?? <User size={13} />}
                    </div>
                    <button
                      onClick={() => signOutMutation.mutate()}
                      title="Sign out"
                      aria-label="Sign out"
                      className="p-2 rounded-xl text-gray-400 hover:text-[#c8102e] hover:bg-red-50 dark:hover:bg-[#c8102e]/10 transition-all duration-300"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login" className="text-sm font-semibold text-[#1a5c2a] dark:text-[#4caf28] hover:bg-[#f0faf2] dark:hover:bg-[#1a5c2a]/20 px-3 py-2 rounded-xl transition-all duration-300">
                    Sign In
                  </Link>
                  <Link href="/login?mode=signup" className="text-sm font-bold text-white bg-[#c8102e] hover:bg-[#a30d25] px-4 py-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    Sign Up
                  </Link>
                </div>
              )
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden p-2 rounded-xl text-[#1a5c2a] dark:text-[#4caf28] hover:bg-[#f0faf2] dark:hover:bg-[#1a5c2a]/20 transition-all duration-300"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              {mobileOpen
                ? <X   className="w-5 h-5 transition-all duration-300" />
                : <Menu className="w-5 h-5 transition-all duration-300" />
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile overlay + drawer — outside <header> so it fills the viewport correctly ── */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={cn(
          'lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{ top: NAVBAR_H }}
      />

      {/* Drawer */}
      <nav
        id="mobile-nav"
        aria-label="Mobile navigation"
        className={cn(
          'lg:hidden fixed right-0 z-50 w-[300px] max-w-[90vw]',
          'bg-white dark:bg-[#0f1a12] shadow-2xl',
          'flex flex-col',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
          'overflow-y-auto overscroll-contain',
          'touch-action: pan-y',
          'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700'
        )}
        style={{ top: NAVBAR_H, height: `calc(100dvh - ${NAVBAR_H}px)` }}
      >
        {/* Top section: logo + links */}
        <div className="flex-1 p-5">
          {/* Kenya bar */}
          <div className="kenya-bar rounded-full mb-5" />

          {/* Logo */}
          <div className="mb-5 pb-4 border-b border-[#e8f5ea] dark:border-[#1a2e1e]">
            <Image src="/logo.svg" alt="026NEWS" width={200} height={60} className="h-14 w-auto object-contain" />
          </div>

          <p className="text-[10px] font-black text-[#1a5c2a]/50 dark:text-[#4caf28]/50 uppercase tracking-widest mb-3">
            News Categories
          </p>
          <ul className="space-y-0.5" role="list">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMobile}
                  className={cn(
                    'block px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    'text-gray-700 dark:text-gray-300',
                    'hover:bg-[#f0faf2] dark:hover:bg-[#1a5c2a]/20 hover:text-[#1a5c2a] dark:hover:text-[#4caf28]',
                    pathname === link.href && 'bg-[#f0faf2] dark:bg-[#1a5c2a]/20 text-[#1a5c2a] dark:text-[#4caf28] font-semibold'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: auth actions */}
        <div className="p-5 pt-0 space-y-3 border-t border-[#e8f5ea] dark:border-[#1a2e1e]">
          {user ? (
            <>
              {/* User card */}
              <div className="flex items-center gap-3 bg-[#f0faf2] dark:bg-[#162319] p-3 rounded-2xl mt-4">
                <div className="w-9 h-9 rounded-full bg-[#1a5c2a] text-white flex items-center justify-center font-bold text-sm shrink-0 select-none">
                  {profile?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile?.name ?? 'Account'}</p>
                  <p className="text-xs text-[#2d8a47] capitalize">{profile?.role === 'journalist' ? 'Author' : (profile?.role ?? 'Reader')}</p>
                </div>
              </div>

              {(profile?.role === 'admin' || profile?.role === 'journalist') && (
                <Link
                  href={profile.role === 'admin' ? '/admin/dashboard' : '/journalist/dashboard'}
                  onClick={closeMobile}
                  className="flex items-center justify-center gap-2 w-full text-sm font-bold text-white bg-[#1a5c2a] hover:bg-[#2d8a47] py-3 rounded-2xl transition-all duration-300"
                >
                  <LayoutDashboard size={14} />
                  {profile.role === 'admin' ? 'Admin Dashboard' : 'Writer Dashboard'}
                </Link>
              )}
              <button
                onClick={() => { closeMobile(); signOutMutation.mutate() }}
                className="flex items-center justify-center gap-2 w-full text-sm font-bold text-[#c8102e] bg-red-50 dark:bg-[#c8102e]/10 hover:bg-red-100 dark:hover:bg-[#c8102e]/20 py-3 rounded-2xl transition-all duration-300"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={closeMobile}
                className="flex items-center justify-center w-full text-sm font-semibold text-[#1a5c2a] dark:text-[#4caf28] bg-[#f0faf2] dark:bg-[#1a5c2a]/20 hover:bg-[#e0f5e4] py-3 rounded-2xl transition-all duration-300 mt-4"
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                onClick={closeMobile}
                className="flex items-center justify-center w-full text-sm font-bold text-white bg-[#c8102e] hover:bg-[#a30d25] py-3 rounded-2xl transition-all duration-300 shadow-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  )
}
