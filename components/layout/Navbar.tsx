'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

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
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" aria-label="026News — go to homepage" className="shrink-0">
          <Image
            src="/logo.svg"
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
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href.split('?')[0]))
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search */}
          {searchOpen ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                autoFocus
                type="search"
                placeholder="Search news..."
                aria-label="Search articles"
                onBlur={() => setSearchOpen(false)}
                className="pl-8 pr-3 py-1.5 border border-blue-300 rounded-full text-sm bg-white focus:outline-none w-48"
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}

          <Link
            href="/subscribe"
            className="hidden sm:inline-flex text-sm font-bold text-white bg-[#0a1628] hover:bg-[#1a3a6e] px-3 py-1.5 rounded-lg transition-colors"
          >
            Subscribe
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign In
          </Link>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 flex gap-2">
            <Link href="/subscribe" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-bold text-white bg-[#0a1628] py-2 rounded-lg">
              Subscribe
            </Link>
            <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-bold text-white bg-orange-500 py-2 rounded-lg">
              Sign In
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
