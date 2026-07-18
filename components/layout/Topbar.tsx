'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { MobileDrawerNav } from '@/components/layout/MobileDrawerNav'
import { NavbarNotificationDropdown } from '@/components/layout/NavbarNotificationDropdown'

type TopbarUser = { name: string | null; profile_image: string | null; role?: string }

interface MobileNavConfig {
  title: string
  groups: { section: string; items: { href: string; label: string; icon: string }[] }[]
  baseHref: string
  logoutHref: string
}

interface TopbarNotifications {
  userId: number
  role: 'admin' | 'journalist'
}

export function Topbar({ title, user, mobileNav, notifications }: {
  title: string
  user: TopbarUser
  mobileNav?: MobileNavConfig
  notifications?: TopbarNotifications
}) {
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {mobileNav && (
            <MobileDrawerNav
              title={mobileNav.title}
              groups={mobileNav.groups}
              baseHref={mobileNav.baseHref}
              logoutHref={mobileNav.logoutHref}
            />
          )}
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {notifications && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                aria-label="Notifications"
                className="flex items-center justify-center"
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                <Bell size={16} />
              </button>
              {notifOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setNotifOpen(false)} />
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, zIndex: 60 }}>
                    <NavbarNotificationDropdown
                      userId={notifications.userId}
                      role={notifications.role}
                      onClose={() => setNotifOpen(false)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <Link
            href="/"
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: 6,
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
                gap: 6,
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
                  width={30}
                  height={30}
                  style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 12,
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
                    width: 200,
                    background: 'var(--bg-surface)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                    padding: 4,
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{user.name || 'User'}</strong>
                  </div>
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
                      fontSize: 12,
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
    </header>
  )
}