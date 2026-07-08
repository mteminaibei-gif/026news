'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Moon, Sun, Search, Menu, X, LayoutDashboard, LogOut, User } from 'lucide-react'
import { useUser, useProfile, useSignOut } from '@/lib/hooks/useAuth'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/?category=Kenya', label: '🇰🇪 Kenya' },
  { href: '/?category=Africa', label: '🌍 Africa' },
  { href: '/?category=Politics', label: 'Politics' },
  { href: '/?category=Business', label: 'Business' },
  { href: '/?category=Tech', label: 'Tech' },
  { href: '/?category=Sports', label: 'Sports' },
  { href: '/?category=Health', label: 'Health' },
  { href: '/journalists', label: 'Journalists' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { darkMode, toggleDarkMode } = useTheme()

  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  const signOutMutation = useSignOut()

  return (
    <header
      className="bg-white/95 dark:bg-[#0f1a12]/95 backdrop-blur-md border-b-2 border-[#1a5c2a] dark:border-[#2d8a47] sticky top-0 z-50 transition-all duration-300 shadow-sm"
      role="banner"
    >
      {/* Kenya flag top stripe */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#1a5c2a]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" aria-label="026NEW Blog — go to homepage" className="shrink-0 transition-opacity hover:opacity-90">
          <Image
            src={darkMode ? '/logo-dark.svg' : '/logo.svg'}
            alt="026NEW Blog"
            width={180}
            height={48}
            priority
            className="h-11 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href ||
              (link.href !== '/' && pathname?.startsWith(link.href.split('?')[0]))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-[#1a5c2a] bg-[#e8f5ea] dark:text-[#4caf28] dark:bg-[#1a5c2a]/30 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-[#1a5c2a] hover:bg-[#e8f5ea] dark:hover:text-[#4caf28] dark:hover:bg-[#1a5c2a]/20'
                )}
              >
                {link.label}
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a5c2a] text-sm">🔍</span>
              <input
                ref={searchInputRef}
                autoFocus
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search news..."
                aria-label="Search articles"
                onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                className="pl-8 pr-3 py-1.5 border-2 border-[#4caf28] rounded-full text-sm bg-white dark:bg-[#1a2e1e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4caf28]/30 w-48 transition-all"
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="p-2 rounded-lg text-[#1a5c2a] dark:text-[#4caf28] hover:bg-[#e8f5ea] dark:hover:bg-[#1a5c2a]/30 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative flex items-center h-7 w-12 rounded-full bg-[#e8f5ea] dark:bg-[#1a2e1e] p-1 cursor-pointer transition-colors duration-300 focus:outline-none border border-[#4caf28]/30"
          >
            <span className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full bg-[#1a5c2a] dark:bg-[#4caf28] shadow transition-transform duration-300 ease-in-out',
              darkMode ? 'translate-x-5' : 'translate-x-0'
            )}>
              {darkMode
                ? <Moon size={11} className="text-white" />
                : <Sun size={11} className="text-white" />
              }
            </span>
          </button>

          {/* Auth */}
          {!userLoading && (
            user ? (
              <div className="hidden sm:flex items-center gap-2">
                {profile?.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#1a5c2a] hover:bg-[#2d8a47] px-3 py-2 rounded-lg transition-all shadow-sm"
                  >
                    <LayoutDashboard size={14} />
                    Admin
                  </Link>
                )}
                {profile?.role === 'journalist' && (
                  <Link
                    href="/journalist/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#1a5c2a] hover:bg-[#2d8a47] px-3 py-2 rounded-lg transition-all shadow-sm"
                  >
                    <LayoutDashboard size={14} />
                    Writer
                  </Link>
                )}
                <div className="flex items-center gap-2 pl-2 border-l border-[#4caf28]/30">
                  <div className="w-8 h-8 rounded-full bg-[#e8f5ea] dark:bg-[#1a5c2a]/40 text-[#1a5c2a] dark:text-[#4caf28] flex items-center justify-center font-bold text-sm border border-[#4caf28]/30">
                    {profile?.name?.charAt(0).toUpperCase() ?? <User size={14} />}
                  </div>
                  <button
                    onClick={() => signOutMutation.mutate()}
                    title="Sign Out"
                    className="p-2 rounded-lg text-gray-500 hover:text-[#c8102e] hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[#1a5c2a] dark:text-[#4caf28] hover:bg-[#e8f5ea] dark:hover:bg-[#1a5c2a]/20 px-3 py-2 rounded-lg transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="text-sm font-bold text-white bg-[#c8102e] hover:bg-[#a00d24] px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow"
                >
                  Sign Up
                </Link>
              </div>
            )
          )}

          {/* Mobile trigger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-[#1a5c2a] dark:text-[#4caf28] hover:bg-[#e8f5ea] dark:hover:bg-[#1a5c2a]/30 transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 top-16 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        >
          <nav
            className="absolute top-0 right-0 w-72 h-[calc(100vh-4rem)] bg-white dark:bg-[#0f1a12] shadow-2xl border-l-2 border-[#1a5c2a] p-5 flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
            aria-label="Mobile navigation"
          >
            <div className="space-y-1">
              {/* Kenya flag stripe */}
              <div className="kenya-bar rounded-full mb-4" />
              <p className="text-xs font-bold text-[#1a5c2a] dark:text-[#4caf28] uppercase tracking-wider mb-3">
                📰 News Categories
              </p>
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-[#1a5c2a] bg-[#e8f5ea] dark:text-[#4caf28] dark:bg-[#1a5c2a]/30 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-[#e8f5ea] dark:hover:bg-[#1a5c2a]/20 hover:text-[#1a5c2a] dark:hover:text-[#4caf28]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t-2 border-[#4caf28]/20 space-y-3">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-[#e8f5ea] dark:bg-[#1a2e1e] p-2 rounded-xl border border-[#4caf28]/20">
                    <div className="w-9 h-9 rounded-full bg-[#1a5c2a] text-white flex items-center justify-center font-bold">
                      {profile?.name?.charAt(0).toUpperCase() ?? <User size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile?.name ?? 'Account'}</p>
                      <p className="text-xs text-[#2d8a47] truncate capitalize">{profile?.role ?? 'Reader'}</p>
                    </div>
                  </div>
                  {(profile?.role === 'admin' || profile?.role === 'journalist') && (
                    <Link
                      href={profile.role === 'admin' ? '/admin/dashboard' : '/journalist/dashboard'}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 w-full text-sm font-bold text-white bg-[#1a5c2a] hover:bg-[#2d8a47] py-2.5 rounded-lg transition-colors"
                    >
                      <LayoutDashboard size={14} />
                      {profile.role === 'admin' ? 'Admin Dashboard' : 'Writer Dashboard'}
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileOpen(false); signOutMutation.mutate() }}
                    className="flex items-center justify-center gap-2 w-full text-sm font-bold text-[#c8102e] hover:bg-red-50 dark:hover:bg-red-900/10 py-2.5 rounded-lg transition-colors border border-[#c8102e]/20"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="w-full text-center text-sm font-semibold text-[#1a5c2a] dark:text-[#4caf28] hover:bg-[#e8f5ea] dark:hover:bg-[#1a5c2a]/20 py-2.5 rounded-lg transition-colors border border-[#4caf28]/30">
                    Sign In
                  </Link>
                  <Link href="/login?mode=signup" onClick={() => setMobileOpen(false)} className="w-full text-center text-sm font-bold text-white bg-[#c8102e] hover:bg-[#a00d24] py-2.5 rounded-lg transition-colors shadow-sm">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
