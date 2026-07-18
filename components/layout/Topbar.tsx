'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

type TopbarUser = { name: string | null; profile_image: string | null; role?: string }

const ADMIN_LINKS = [
  { href: '/admin/profile', label: 'Dashboard' },
  { href: '/admin/articles', label: 'Articles' },
  { href: '/admin/journalists', label: 'Journalists' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/sources', label: 'Sources' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/earnings', label: 'Earnings' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/settings', label: 'Settings' },
]

export function Topbar({ title, user }: { title: string; user: TopbarUser }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = title === 'Admin'

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          height: 53,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              N
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              026<span style={{ color: 'var(--primary)' }}>connet!</span>
            </span>
          </Link>
          {title && (
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginLeft: 8,
                paddingLeft: 12,
                borderLeft: '1px solid var(--border)',
              }}
            >
              {title}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              transition: 'background 0.15s',
            }}
          >
            Home
          </Link>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen(!open)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 2,
                border: 'none',
                borderRadius: '50%',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.name || ''}
                  width={32}
                  height={32}
                  style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {(user.name || 'U')[0]?.toUpperCase()}
                </div>
              )}
            </button>

            {open && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 4,
                    width: 220,
                    background: 'var(--bg-surface)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                    padding: 4,
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.name || 'User'}</strong>
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  {user.role === 'admin' && (
                    <Link
                      href="/admin/profile"
                      onClick={() => setOpen(false)}
                      style={{
                        display: 'block',
                        padding: '8px 12px',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        borderRadius: 8,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {user.role === 'journalist' && (
                    <Link
                      href="/journalist/profile"
                      onClick={() => setOpen(false)}
                      style={{
                        display: 'block',
                      padding: '8px 12px',
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      borderRadius: 8,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Journalist Dashboard
                  </Link>
                  )}
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <button
                    onClick={async () => {
                      const { createClient } = await import('@/lib/supabase/client')
                      const supabase = createClient()
                      await supabase.auth.signOut()
                      window.location.href = '/'
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: 13,
                      color: 'var(--error)',
                      background: 'none',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--error-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Admin secondary navigation */}
      {isAdmin && (
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            borderTop: '1px solid var(--border)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <nav
            style={{
              display: 'flex',
              gap: 0,
              padding: '0 16px',
              whiteSpace: 'nowrap',
            }}
          >
            {ADMIN_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/admin/profile' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'block',
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
