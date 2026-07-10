'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

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
  { href: '/journalist/create', label: 'New Article', icon: '✏️' },
  { href: '/', label: 'View Site', icon: '🏠' },
]
const ADMIN_NAV: NavItem[] = [
  { href: '/admin/dashboard',   label: 'Dashboard',  icon: '📊' },
  { href: '/admin/articles',    label: 'Articles',   icon: '📰' },
  { href: '/admin/journalists', label: 'Authors',    icon: '✍️' },
  { href: '/admin/sources',     label: 'Sources',    icon: '🌐' },
  { href: '/admin/users',       label: 'Users',      icon: '👥' },
  { href: '/admin/analytics',   label: 'Analytics',  icon: '📈' },
  { href: '/admin/earnings',    label: 'Earnings',   icon: '💰' },
  { href: '/admin/settings',    label: 'Settings',   icon: '⚙️' },
]
const ADMIN_QUICK: NavItem[] = [
  { href: '/admin/write', label: 'Write Article', icon: '✏️' },
  { href: '/',            label: 'View Site',     icon: '🏠' },
]

export function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname()
  const navItems = role === 'journalist' ? JOURNALIST_NAV : ADMIN_NAV
  const quickItems = role === 'journalist' ? JOURNALIST_QUICK : ADMIN_QUICK
  const tagline = role === 'journalist' ? 'Author Portal' : 'Admin Panel'

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-collapse on tablet/mobile
      setIsCollapsed(window.innerWidth < 1200)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64'
  
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <aside className={cn(
        'bg-gradient-to-b from-[#1a5c2a] via-[#2d5a31] to-[#1a5c2a] text-white flex flex-col fixed top-0 left-0 h-screen z-40 overflow-hidden transition-all duration-300 shadow-2xl',
        sidebarWidth,
        isMobile && isCollapsed && '-translate-x-full'
      )}>
        {/* Kenya flag stripe with enhanced colors */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#4caf28] shadow-sm" />

        {/* Header with toggle button */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
          <div className={cn('flex items-center gap-3 transition-opacity', isCollapsed && 'opacity-0')}>
            <Link href="/" aria-label="026NEW Blog home" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-[#f5c518] to-[#d4a010] rounded-lg flex items-center justify-center shadow-md">
                <span className="text-[#1a1a1a] font-black text-sm">02</span>
              </div>
              {!isCollapsed && (
                <div className="ml-2">
                  <p className="text-sm font-bold text-white">026NEWS</p>
                  <p className="text-[10px] text-[#f5c518]/70 font-semibold">{tagline}</p>
                </div>
              )}
            </Link>
          </div>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-[#f5c518] hover:text-white"
            aria-label="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isCollapsed ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map(item => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                      isActive
                        ? 'bg-gradient-to-r from-[#f5c518] to-[#d4a010] text-[#1a1a1a] shadow-md'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={cn('text-lg flex-shrink-0 transition-transform group-hover:scale-110', isActive && 'drop-shadow-sm')}>
                      {item.icon}
                    </span>
                    <span className={cn('transition-opacity duration-300 whitespace-nowrap', isCollapsed && 'opacity-0 w-0 overflow-hidden')}>
                      {item.label}
                    </span>
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 bg-[#1a1a1a] text-white px-2 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          {quickItems.length > 0 && (
            <>
              {!isCollapsed && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#f5c518]/50 px-3 mt-6 mb-2 transition-opacity">
                  Quick Actions
                </p>
              )}
              <ul className="space-y-1 mt-2">
                {quickItems.map(item => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                          isActive
                            ? 'bg-gradient-to-r from-[#c8102e] to-[#a51123] text-white shadow-md'
                            : 'text-white/70 hover:bg-[#c8102e]/20 hover:text-[#f5c518]'
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <span className={cn('text-lg flex-shrink-0 transition-transform group-hover:scale-110', isActive && 'drop-shadow-sm')}>
                          {item.icon}
                        </span>
                        <span className={cn('transition-opacity duration-300 whitespace-nowrap', isCollapsed && 'opacity-0 w-0 overflow-hidden')}>
                          {item.label}
                        </span>
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 bg-[#1a1a1a] text-white px-2 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {item.label}
                          </div>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </nav>

        {/* User section */}
        <div className={cn('px-3 py-4 border-t border-white/10 transition-all', isCollapsed && 'px-2')}>
          <div className="flex items-center gap-3">
            <div className="relative">
              {user.profile_image ? (
                <Image 
                  src={user.profile_image} 
                  alt={user.name} 
                  width={40} 
                  height={40} 
                  className="rounded-full object-cover ring-2 ring-[#f5c518]/50 shadow-lg" 
                  unoptimized 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5c518] to-[#d4a010] text-[#1a1a1a] flex items-center justify-center text-lg font-black shadow-lg">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4caf28] rounded-full border-2 border-[#1a5c2a]" />
            </div>
            
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-[#f5c518]/70 font-medium capitalize">{role === 'journalist' ? 'Author' : 'Admin'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
