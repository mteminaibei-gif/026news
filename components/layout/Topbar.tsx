import Image from 'next/image'
import Link from 'next/link'
import { NotificationBell } from '@/components/ui/NotificationBell'

interface TopbarProps {
  title: string
  user: { name: string; profile_image: string | null; user_id?: number; role?: 'admin' | 'journalist' | 'reader' }
  children?: React.ReactNode
}

export function Topbar({ title, user, children }: TopbarProps) {
  return (
    <header
      className="backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20"
      style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Left: Kenya accent bar + title */}
      <div className="flex items-center gap-3">
        <span
          className="w-1.5 h-8 rounded-full shrink-0"
          style={{ background: 'linear-gradient(to bottom, var(--error), var(--text-primary), var(--success))' }}
        />
        <div>
          <h1
            className="text-lg sm:text-xl font-bold"
            style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--primary)' }}
          >
            {title}
          </h1>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
            <span>Live Dashboard</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {children}

        <span className="text-sm hidden sm:block font-medium" style={{ color: 'var(--text-secondary)' }}>
          Welcome, <span className="font-bold" style={{ color: 'var(--primary)' }}>{user.name}</span>
        </span>

        {/* Notification bell */}
        <div className="relative">
          <NotificationBell
            userId={user.user_id ?? 1}
            role={user.role ?? 'journalist'}
          />
        </div>

        {/* Profile avatar with enhanced styling */}
        <Link
          href={user.role === 'admin' ? '/admin/settings' : '/journalist/profile'}
          aria-label="View profile"
          className="transition-all duration-300 hover:scale-110 group"
        >
          {user.profile_image ? (
            <div className="relative">
              <Image
                src={user.profile_image}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-full object-cover transition-all duration-300 shadow-md"
                style={{ border: '2px solid var(--primary-light)' }}
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: 'var(--success)' }} />
            </div>
          ) : (
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all duration-300 shadow-md"
                style={{ background: 'linear-gradient(to bottom right, var(--primary), var(--success))', border: '2px solid var(--primary-light)' }}
              >
                {user.name.charAt(0)}
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: 'var(--success)' }} />
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
