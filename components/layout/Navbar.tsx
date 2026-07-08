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
  { href: '/?category=Politics', label: 'Politics' },
  { href: '/?category=Business', label: 'Business' },
  { href: '/?category=Tech', label: 'Tech' },
  { href: '/?category=Science', label: 'Science' },
  { href: '/?category=Sports', label: 'Sports' },
  { href: '/?category=Entertainment', label: 'Entertainment' },
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
    <header className="bg-white/95 dark:bg-[#0a1628]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/80 sticky top-0 z-50 transition-all duration-300" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" aria-label="026News — go to homepage" className="shrink-0 transition-opacity hover:opacity-90">
          <Image
            src={darkMode ? "/logo-dark.svg" : "/logo.svg"}
            alt="026News"
            width={160}
            height={48}
            priority
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href.split('?')[0]))
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20'
              )}
            >
              {link.label}
            </Link>
          ))}
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                ref={searchInputRef}
                autoFocus
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search news..."
                aria-label="Search articles"
                onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                className="pl-8 pr-3 py-1.5 border border-blue-300 rounded-full text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 transition-all"
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Premium Theme Switcher Pill */}
          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative flex items-center h-7 w-12 rounded-full bg-gray-200 dark:bg-gray-850 p-1 cursor-pointer transition-colors duration-300 focus:outline-none hover:ring-2 hover:ring-blue-500/20"
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow transition-transform duration-300 ease-in-out",
                darkMode ? "translate-x-5" : "translate-x-0"
              )}
            >
              {darkMode ? (
                <Moon size={11} className="text-blue-400 fill-blue-400" />
              ) : (
                <Sun size={11} className="text-amber-500 fill-amber-500" />
              )}
            </span>
          </button>

          {/* User Auth States */}
          {!userLoading && (
            user ? (
              <div className="hidden sm:flex items-center gap-3">
                {profile?.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-all shadow-sm hover:shadow"
                  >
                    <LayoutDashboard size={14} />
                    Admin
                  </Link>
                )}
                {profile?.role === 'journalist' && (
                  <Link
                    href="/journalist/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-all shadow-sm hover:shadow"
                  >
                    <LayoutDashboard size={14} />
                    Writer
                  </Link>
                )}
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    {profile?.name?.charAt(0).toUpperCase() ?? <User size={14} />}
                  </div>
                  <button
                    onClick={() => signOutMutation.mutate()}
                    title="Sign Out"
                    className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-555/10 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-4.5 py-2 rounded-lg transition-all shadow-sm hover:shadow hover:scale-[1.01]"
                >
                  Sign Up
                </Link>
              </div>
            )
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Modernized Mobile menu overlay drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)}>
          <nav
            className="absolute top-0 right-0 w-64 h-[calc(100vh-4rem)] bg-white/95 dark:bg-[#0a1628]/95 backdrop-blur-md shadow-2xl border-l border-gray-150 dark:border-gray-800 p-5 flex flex-col justify-between transition-transform duration-300 ease-out transform translate-x-0"
            onClick={e => e.stopPropagation()}
            aria-label="Mobile navigation"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</p>
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-blue-600 bg-blue-50/80 dark:text-blue-400 dark:bg-blue-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-blue-600 dark:hover:text-blue-400"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Profile strip & action buttons at the bottom */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/40 p-2 rounded-xl border dark:border-gray-700/50">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {profile?.name?.charAt(0).toUpperCase() ?? <User size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile?.name ?? 'Account'}</p>
                      <p className="text-xs text-gray-400 truncate">{profile?.role ?? 'Reader'}</p>
                    </div>
                  </div>

                  {profile?.role === 'admin' && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 w-full text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg transition-colors"
                    >
                      <LayoutDashboard size={14} />
                      Admin Dashboard
                    </Link>
                  )}
                  {profile?.role === 'journalist' && (
                    <Link
                      href="/journalist/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 w-full text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg transition-colors"
                    >
                      <LayoutDashboard size={14} />
                      Writer Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      signOutMutation.mutate()
                    }}
                    className="flex items-center justify-center gap-2 w-full text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 py-2.5 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/20"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 py-2.5 rounded-lg transition-colors border dark:border-gray-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
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
