'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem { href: string; label: string; icon: string }
interface SidebarProps {
  role: 'journalist' | 'admin'
  user: { name: string; profile_image: string | null }
}

const JOURNALIST_NAV: NavItem[] = [
  { href: '/journalist/dashboard',   label: 'Dashboard',   icon: '📊' },
  { href: '/journalist/articles',    label: 'My Articles', icon: '📰' },
  { href: '/journalist/earnings',    label: 'Earnings',    icon: '💰' },
  { href: '/journalist/analytics',   label: 'Analytics',   icon: '📈' },
  { href: '/journalist/subscribers', label: 'Subscribers', icon: '👥' },
  { href: '/journalist/profile',     label: 'Profile',     icon: '👤' },
]
const JOURNALIST_QUICK: NavItem[] = [
  { href: '/journalist/create', label: 'Create Post', icon: '✏️' },
  { href: '/', label: 'View Site', icon: '🏠' },
]
const ADMIN_NAV: NavItem[] = [
  { href: '/admin/dashboard',   label: 'Dashboard',   icon: '📊' },
  { href: '/admin/articles',    label: 'Articles',    icon: '📰' },
  { href: '/admin/journalists', label: 'Journalists', icon: '✍️' },
  { href: '/admin/sources',     label: 'Sources',     icon: '🌐' },
  { href: '/admin/users',       label: 'Users',       icon: '👥' },
  { href: '/admin/analytics',   label: 'Analytics',   icon: '📈' },
  { href: '/admin/earnings',    label: 'Earnings',    icon: '💰' },
  { href: '/admin/settings',    label: 'Settings',    icon: '⚙️' },
]
const ADMIN_QUICK: NavItem[] = [
  { href: '/admin/write', label: 'Write Article', icon: '✏️' },
  { href: '/',            label: 'View Site',     icon: '🏠' },
]

export function Sidebar({ role, user }: SidebarProps) {
  const pathname   = usePathname()
  const navItems   = role === 'journalist' ? JOURNALIST_NAV   : ADMIN_NAV
  const quickItems = role === 'journalist' ? JOURNALIST_QUICK : ADMIN_QUICK
  const tagline    = role === 'journalist' ? 'Journalist Portal' : 'Admin Panel'

  return (
    <aside className="w-60 bg-[#1a5c2a] text-white flex flex-col fixed top-0 left-0 h-screen z-40 overflow-y-auto">
      {/* Kenya flag stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#4caf28]" />

      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <Link href="/" aria-label="026NEW Blog home">
          <Image src="/026newslogo.png" alt="026NEW Blog" width={220} height={64} className="h-16 w-auto object-contain" />
        </Link>
        <p className="text-[11px] text-[#f5c518]/70 mt-1 font-semibold">{tagline}</p>
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
                    ? 'bg-white/15 text-white border border-[#f5c518]/20'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#f5c518]/40 px-3 mt-5 mb-2">
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
                        ? 'bg-[#f5c518] text-[#1a1a1a] font-bold'
                        : 'text-white/65 hover:bg-[#f5c518]/15 hover:text-[#f5c518]'
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

      {/* User strip */}
      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        {user.profile_image ? (
          <Image src={user.profile_image} alt={user.name} width={36} height={36} className="rounded-full object-cover ring-2 ring-[#f5c518]/40" unoptimized />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#f5c518] text-[#1a1a1a] flex items-center justify-center text-sm font-black">
            {user.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user.name}</p>
          <p className="text-[11px] text-[#f5c518]/60 capitalize">{role}</p>
        </div>
      </div>
    </aside>
  )
}
