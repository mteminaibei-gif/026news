'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface SidebarProps {
  role: 'journalist' | 'admin'
  user: { name: string; profile_image: string | null }
}

const JOURNALIST_NAV: NavItem[] = [
  { href: '/journalist/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/journalist/articles', label: 'My Articles', icon: '📰' },
  { href: '/journalist/earnings', label: 'Earnings', icon: '💰' },
  { href: '/journalist/analytics', label: 'Analytics', icon: '📈' },
  { href: '/journalist/subscribers', label: 'Subscribers', icon: '👥' },
  { href: '/journalist/profile', label: 'Profile', icon: '👤' },
]

const JOURNALIST_QUICK: NavItem[] = [
  { href: '/journalist/create', label: 'Create Post', icon: '✏️' },
  { href: '/', label: 'View Site', icon: '🏠' },
]

const ADMIN_NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/articles', label: 'Articles', icon: '📰' },
  { href: '/admin/journalists', label: 'Journalists', icon: '✍️' },
  { href: '/admin/sources', label: 'Sources', icon: '🌐' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/earnings', label: 'Earnings', icon: '💰' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname()
  const navItems = role === 'journalist' ? JOURNALIST_NAV : ADMIN_NAV
  const quickItems = role === 'journalist' ? JOURNALIST_QUICK : []
  const tagline = role === 'journalist' ? 'Journalist Portal' : 'Admin Panel'

  return (
    <aside className="w-60 bg-[#0a1628] text-white flex flex-col fixed top-0 left-0 h-screen z-40 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <Link href="/" aria-label="026News home">
          <Image
            src="/logo-dark.svg"
            alt="026News"
            width={130}
            height={40}
            className="h-9 w-auto"
          />
        </Link>
        <p className="text-[11px] text-white/30 mt-1">{tagline}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-0.5">
          {navItems.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  pathname === item.href
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                )}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {quickItems.length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-3 mt-5 mb-2">
              Quick Actions
            </p>
            <ul className="space-y-0.5">
              {quickItems.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      pathname === item.href
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/8 hover:text-white'
                    )}
                  >
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        {user.profile_image ? (
          <Image
            src={user.profile_image}
            alt={user.name}
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            {user.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user.name}</p>
          <p className="text-[11px] text-white/40 capitalize">{role}</p>
        </div>
      </div>
    </aside>
  )
}
