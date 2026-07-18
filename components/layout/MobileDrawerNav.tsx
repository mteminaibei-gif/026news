'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { X, LogOut } from 'lucide-react'
import { useSignOut } from '@/lib/hooks/useAuth'

interface MobileNavItem {
  href: string
  label: string
  icon: string
}

interface MobileDrawerNavProps {
  title: string
  groups: { section: string; items: MobileNavItem[] }[]
  /** Active when pathname === href or (href !== base && pathname startsWith href) */
  baseHref: string
  logoutHref: string
}

export function MobileDrawerNav({ title, groups, baseHref, logoutHref }: MobileDrawerNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const signOutMutation = useSignOut()

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const isActive = (href: string) =>
    pathname === href || (href !== baseHref && pathname.startsWith(href))

  return (
    <>
      {/* Hamburger — only visible below lg, where the sidebar is hidden */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="lg:hidden flex items-center justify-center"
        style={{
          width: 40, height: 40, borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          cursor: 'pointer', color: 'var(--text-secondary)',
          transition: 'all 0.2s',
        }}
      >
        {open ? <X size={18} /> : (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ width: 16, height: 2, borderRadius: 2, background: 'currentColor', display: 'block' }} />
            <span style={{ width: 16, height: 2, borderRadius: 2, background: 'currentColor', display: 'block' }} />
            <span style={{ width: 16, height: 2, borderRadius: 2, background: 'currentColor', display: 'block' }} />
          </span>
        )}
      </button>

      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ top: 48, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      />

      {/* Drawer */}
      <nav
        aria-label="Mobile navigation"
        className={`lg:hidden fixed right-0 z-50 flex flex-col overflow-y-auto ${open ? 'flex' : 'hidden'}`}
        style={{
          width: 300, maxWidth: '85vw',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-xl)',
          top: 48,
          height: 'calc(100dvh - 48px)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s',
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {title}
          </span>
        </div>

        <div className="flex-1 p-3 space-y-4 overflow-y-auto">
          {groups.map(group => (
            <div key={group.section}>
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: isActive(item.href) ? 'var(--primary)' : 'transparent',
                      color: isActive(item.href) ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => signOutMutation.mutate()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-center w-full transition-all"
            style={{ color: 'var(--error)', background: 'var(--error-light)', border: 'none', cursor: 'pointer' }}
          >
            <span aria-hidden="true">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  )
}