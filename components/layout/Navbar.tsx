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
          'bg-white/95 dark:bg-[#0f1410]/95 backdrop-blur-xl',
          scrolled
            ? 'shadow-[0_4px_24px_rgba(26,92,42,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
            : 'shadow-none'
        )}
      >
        {/* Kenya flag stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#4caf28]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" aria-label="026NEWS — home" className="shrink-0 group">
            <Image
              src="/logo.svg"
              alt="026NEWS"
              width={280}
              height={80}
              priority
              className="h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop nav */}
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
                    'nav-link px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 relative',
                    isActive
                      ? 'bg-[#f0faf2] dark:bg-[#1a5c2a]/20 text-[#1a5c2a] dark:text-[#4caf28]'
                      : 'text-[#374151] dark:text-[#e8f5ea] hover:bg-[#f0faf2] dark:hover:bg-[#1a5c2a]/15 hover:text-[#1a5c2a] dark:hover:text-[#4caf28]'
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1a5c2a] dark:bg-[#4caf28] rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right actions */}
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
                  placeholder="Search Kenya news..."
                  aria-label="Search articles"
                  onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                  className="pl-9 pr-4 py-2.5 rounded-full text-sm font-medium bg-[#f0faf2] dark:bg-[#1a2e1e] text-[#1a1a1a] dark:text-[#f8fdf5] focus:outline-none focus:ring-2 focus:ring-[#4caf28]/40 w-56 transition-all duration-300 placeholder-[#6b7280] dark:placeholder-[#81c784]"
                />
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="p-2.5 rounded-xl bg-[#f0faf2] dark:bg-[#1a5c2a]/20 text-[#1a5c2a] dark:text-[#4caf28] hover:bg-[#e8f5ea] dark:hover:bg-[#1a5c2a]/30 transition-all duration-300"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={cn(
                'relative flex items-center h-8 w-14 rounded-full p-1 transition-all duration-300',
                darkMode ? 'bg-[#1a5c2a]' : 'bg-[#f0faf2]'
              )}
            >
              <span className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all duration-300',
                darkMode ? 'translate-x-6 bg-[#f5c518]' : 'translate-x-0 bg-[#1a5c2a]'
              )}>
                {darkMode
                  ? <Moon size={11} className="text-[#1a1a1a]" />
                  : <Sun  size={11} className="text-white" />
                }
              </span>
            </button>

            {/* Auth states */}
            {!userLoading && (
              user ? (
                <div className="hidden sm:flex items-center gap-2">
                  {(profile?.role === 'admin' || profile?.role === 'journalist') && (
                    <Link
                      href={profile.role === 'admin' ? '/admin/dashboard' : '/journalist/dashboard'}
                      className="inline-flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-[#1a5c2a] to-[#2d8a47] hover:from-[#2d8a47] hover:to-[#4caf28] px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-[#1a5c2a]/25 hover:shadow-xl hover:shadow-[#1a5c2a]/35 hover:-translate-y-0.5"
                    >
                      <LayoutDashboard size={13} />
                      {profile.role === 'admin' ? 'Admin' : 'Writer'}
                    </Link>
                  )}
                  <div className="flex items-center gap-2 ml-1">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f0faf2] to-[#e8f5ea] dark:from-[#1a5c2a]/50 dark:to-[#1a5c2a]/30 text-[#1a5c2a] dark:text-[#4caf28] flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-[#4caf28]/20">
                      {profile?.name?.charAt(0).toUpperCase() ?? <User size={14} />}
                    </div>
                    <button
                      onClick={() => signOutMutation.mutate()}
                      title="Sign out"
                      aria-label="Sign out"
                      className="p-2.5 rounded-xl text-[#6b7280] dark:text-[#81c784] hover:text-[#c8102e] hover:bg-[#fef2f2] dark:hover:bg-[#c8102e]/10 transition-all duration-300"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login" className="text-sm font-semibold text-[#1a5c2a] dark:text-[#4caf28] hover:bg-[#f0faf2] dark:hover:bg-[#1a5c2a]/20 px-4 py-2.5 rounded-xl transition-all duration-300">
                    Sign In
                  </Link>
                  <Link href="/login?mode=signup" className="text-sm font-bold text-white bg-gradient-to-r from-[#c8102e] to-[#a50d25] hover:from-[#a50d25] hover:to-[#991b1b] px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-[#c8102e]/25 hover:shadow-xl hover:shadow-[#c8102e]/35 hover:-translate-y-0.5">
                    Sign Up
                  </Link>
                </div>
              )
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden p-2.5 rounded-xl bg-[#f0faf2] dark:bg-[#1a5c2a]/20 text-[#1a5c2a] dark:text-[#4caf28] hover:bg-[#e8f5ea] dark:hover:bg-[#1a5c2a]/30 transition-all duration-300"
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

      {/* Mobile overlay */}
      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={cn(
          'lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{ top: NAVBAR_H }}
      />

      {/* Mobile drawer */}
      <nav
        id="mobile-nav"
        aria-label="Mobile navigation"
        className={cn(
          'lg:hidden fixed right-0 z-50 w-[320px] max-w-[85vw]',
          'bg-white dark:bg-[#0f1410] shadow-2xl',
          'flex flex-col',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
          'overflow-y-auto overscroll-contain'
        )}
        style={{ top: NAVBAR_H, height: `calc(100dvh - ${NAVBAR_H}px)` }}
      >
        <div className="flex-1 p-5">
          {/* Kenya bar */}
          <div className="h-1 bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#4caf28] rounded-full mb-5" />

          {/* Logo */}
          <div className="mb-5 pb-4 border-b border-[#e8f5ea] dark:border-[#223d29]">
            <Image src="/logo.svg" alt="026NEWS" width={200} height={60} className="h-14 w-auto object-contain" />
          </div>

          <p className="text-[10px] font-black text-[#1a5c2a]/60 dark:text-[#4caf28]/60 uppercase tracking-widest mb-3">
            News Categories
          </p>
          <ul className="space-y-0.5" role="list">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMobile}
                  className={cn(
                    'block px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                    'text-[#374151] dark:text-[#e8f5ea]',
                    'hover:bg-[#f0faf2] dark:hover:bg-[#1a5c2a]/20 hover:text-[#1a5c2a] dark:hover:text-[#4caf28]',
                    pathname === link.href && 'bg-[#f0faf2] dark:bg-[#1a5c2a]/20 text-[#1a5c2a] dark:text-[#4caf28]'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: auth actions */}
        <div className="p-5 pt-4 space-y-3 border-t border-[#e8f5ea] dark:border-[#223d29]">
          {user ? (
            <>
              {/* User card */}
              <div className="flex items-center gap-3 bg-[#f0faf2] dark:bg-[#162319] p-3 rounded-2xl border-2 border-[#e8f5ea] dark:border-[#223d29]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a5c2a] to-[#2d8a47] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0 select-none">
                  {profile?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1a1a1a] dark:text-[#f8fdf5] truncate">{profile?.name ?? 'Account'}</p>
                  <p className="text-xs text-[#1a5c2a] dark:text-[#4caf28] font-semibold capitalize">{profile?.role === 'journalist' ? 'Author' : (profile?.role ?? 'Reader')}</p>
                </div>
              </div>

              {(profile?.role === 'admin' || profile?.role === 'journalist') && (
                <Link
                  href={profile.role === 'admin' ? '/admin/dashboard' : '/journalist/dashboard'}
                  onClick={closeMobile}
                  className="flex items-center justify-center gap-2 w-full text-sm font-bold text-white bg-gradient-to-r from-[#1a5c2a] to-[#2d8a47] hover:from-[#2d8a47] hover:to-[#4caf28] py-3 rounded-2xl transition-all duration-300 shadow-lg"
                >
                  <LayoutDashboard size={14} />
                  {profile.role === 'admin' ? 'Admin Dashboard' : 'Writer Dashboard'}
                </Link>
              )}
              <button
                onClick={() => { closeMobile(); signOutMutation.mutate() }}
                className="flex items-center justify-center gap-2 w-full text-sm font-bold text-[#c8102e] bg-[#fef2f2] dark:bg-[#c8102e]/10 hover:bg-[#fee2e2] dark:hover:bg-[#c8102e]/20 py-3 rounded-2xl transition-all duration-300"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={closeMobile}
                className="flex items-center justify-center w-full text-sm font-semibold text-[#1a5c2a] dark:text-[#4caf28] bg-[#f0faf2] dark:bg-[#1a5c2a]/20 hover:bg-[#e0f5e4] py-3.5 rounded-2xl transition-all duration-300 mt-4 border-2 border-[#e8f5ea] dark:border-[#223d29]"
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                onClick={closeMobile}
                className="flex items-center justify-center gap-2 w-full text-sm font-bold text-white bg-gradient-to-r from-[#c8102e] to-[#a50d25] hover:from-[#a50d25] hover:to-[#991b1b] py-3.5 rounded-2xl transition-all duration-300 shadow-lg"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        {/* Kenya flag footer in drawer */}
        <div className="p-4 border-t border-[#e8f5ea] dark:border-[#223d29]">
          <div className="h-1.5 bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#4caf28] rounded-full" />
          <p className="text-[10px] text-center text-[#6b7280] dark:text-[#81c784] mt-2 font-medium">
            Made in Kenya 🇰🇪
          </p>
        </div>
      </nav>
    </>
  )
}
