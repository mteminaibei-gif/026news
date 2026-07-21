'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  MessageSquare, Bell, Bookmark, PenLine, LogOut, Sun, Moon, Settings, BarChart3,
  LayoutDashboard, DollarSign, Star, Newspaper, FileText, Users, UsersRound,
  TrendingUp, Eye, Award, UserCheck, Tag, Globe, PenTool, Mail, Compass, Radio, Tv,
} from 'lucide-react'
import { useUser, useProfile, useSignOut } from '@/lib/hooks/useAuth'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages'

interface NavItem {
  href: string
  label: string
  Icon: any
  match?: (p: string) => boolean
  badge?: number
}

export function AppSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean
  onClose: () => void
}) {
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab')
  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  const signOut = useSignOut()
  const { darkMode, toggleDarkMode } = useTheme()
  const role = (profile?.role as string) ?? 'reader'
  const { unreadCount } = useNotifications(profile?.user_id ?? 0, role as 'admin' | 'journalist' | 'reader')
  const { unread: unreadMessages } = useUnreadMessages()

  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (item: NavItem) =>
    item.match ? item.match(pathname) : pathname === item.href

  const personal: NavItem[] = [
    { href: '/social', label: 'Feed', Icon: Users, match: p => p.startsWith('/social') },
    { href: '/inbox', label: 'Messages', Icon: MessageSquare, badge: unreadMessages },
    ...(role !== 'admin' ? [{ href: '/notifications', label: 'Notifications', Icon: Bell, badge: unreadCount }] : []),
    { href: '/saved', label: 'Saved', Icon: Bookmark, match: p => p.startsWith('/saved') },
    { href: '/communities', label: 'Communities', Icon: UsersRound, match: p => p.startsWith('/communities') },
    { href: '/people', label: 'People', Icon: UsersRound, match: p => p.startsWith('/people') },
    { href: '/profile', label: 'My Profile', Icon: Settings, match: p => p.startsWith('/profile') || p.startsWith('/stats') },
  ]

  const browse: NavItem[] = [
    { href: '/explore', label: 'Explore', Icon: Compass, match: p => p.startsWith('/explore') || p.startsWith('/category') },
    { href: '/news', label: 'News', Icon: Newspaper, match: p => p.startsWith('/news') },
    { href: '/articles', label: 'Articles', Icon: FileText, match: p => p.startsWith('/articles') },
    { href: '/radio', label: 'Radio', Icon: Radio, match: p => p.startsWith('/radio') },
    { href: '/tv', label: 'TV', Icon: Tv, match: p => p.startsWith('/tv') },
  ]

  const studio = role === 'journalist'
    ? [
        { href: '/journalist', label: 'Overview', Icon: BarChart3, match: (p: string) => p === '/journalist' && !activeTab },
        { href: '/journalist/create', label: 'Write Article', Icon: PenLine, match: (p: string) => p.startsWith('/journalist/create') || p.startsWith('/journalist/edit') },
        { href: '/journalist?tab=articles', label: 'My Articles', Icon: FileText, match: () => activeTab === 'articles' },
        { href: '/journalist?tab=analytics', label: 'Analytics', Icon: TrendingUp, match: () => activeTab === 'analytics' },
        { href: '/journalist?tab=earnings', label: 'Earnings', Icon: DollarSign, match: () => activeTab === 'earnings' },
        { href: '/journalist?tab=followers', label: 'Followers', Icon: Users, match: () => activeTab === 'followers' },
        { href: '/journalist?tab=subscribers', label: 'Subscribers', Icon: Bell, match: () => activeTab === 'subscribers' },
        { href: '/journalist?tab=profile', label: 'Profile', Icon: Settings, match: () => activeTab === 'profile' },
      ]
    : role === 'admin'
      ? [
          { href: '/admin', label: 'Overview', Icon: LayoutDashboard, match: (p: string) => p === '/admin' },
          { href: '/admin/articles', label: 'Articles', Icon: FileText, match: (p: string) => p.startsWith('/admin/articles') || p.startsWith('/admin/edit') },
          { href: '/admin/journalists', label: 'Authors', Icon: Users, match: (p: string) => p.startsWith('/admin/journalists') },
          { href: '/admin/users', label: 'Users', Icon: UserCheck, match: (p: string) => p.startsWith('/admin/users') },
          { href: '/admin/reviews', label: 'Reviews', Icon: Star, match: (p: string) => p.startsWith('/admin/reviews') || p.startsWith('/admin/review') },
          { href: '/admin/analytics', label: 'Analytics', Icon: TrendingUp, match: (p: string) => p.startsWith('/admin/analytics') },
          { href: '/admin/earnings', label: 'Earnings', Icon: DollarSign, match: (p: string) => p.startsWith('/admin/earnings') },
          { href: '/admin/sources', label: 'Sources', Icon: Globe, match: (p: string) => p.startsWith('/admin/sources') },
          { href: '/admin/categories', label: 'Categories', Icon: Tag, match: (p: string) => p.startsWith('/admin/categories') },
          { href: '/admin/notifications', label: 'Notifications', Icon: Bell, match: (p: string) => p.startsWith('/admin/notifications') },
          { href: '/admin/settings', label: 'Settings', Icon: Settings, match: (p: string) => p.startsWith('/admin/settings') },
          { href: '/admin/write', label: 'Write Article', Icon: PenTool, match: (p: string) => p.startsWith('/admin/write') },
        ]
      : []

  const SideLink = ({ item }: { item: NavItem }) => (
    <Link
      href={item.href}
      onClick={onClose}
      className={`app-rail-link ${isActive(item) ? 'active' : ''}`}
      aria-current={isActive(item) ? 'page' : undefined}
    >
      <span className="app-rail-icon">
        <item.Icon size={18} />
        {item.badge ? (
          <span className="app-rail-badge">{item.badge > 99 ? '99+' : item.badge}</span>
        ) : null}
      </span>
      <span className="app-rail-label">{item.label}</span>
    </Link>
  )

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="app-rail-section-label">{label}</div>
  )

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={mobileOpen ? 'app-rail-scrim show' : 'app-rail-scrim'}
      />

      <aside className={`app-rail ${mobileOpen ? 'open' : ''}`} aria-label="Personal">
        <div className="app-rail-inner">
          <nav className="app-rail-nav" aria-label="Personal">
            <SectionLabel label="Personal" />
            {personal.map(i => <SideLink key={i.href} item={i} />)}
          </nav>

          <div className="app-rail-sep" />
          <nav className="app-rail-nav" aria-label="Browse">
            <SectionLabel label="Browse" />
            {browse.map(i => <SideLink key={i.href} item={i} />)}
          </nav>

          {studio.length > 0 && (
            <>
              <div className="app-rail-sep" />
              <nav className="app-rail-nav" aria-label="Studio">
                <SectionLabel label={role === 'admin' ? 'Admin' : 'Studio'} />
                {studio.map((i: any) => <SideLink key={i.href} item={i} />)}
              </nav>
            </>
          )}

          <div className="app-rail-bottom">
            {user ? (
              <div className="app-rail-account">
                <button className="app-rail-account-btn" onClick={() => setAccountOpen(v => !v)}>
                  <span className="app-rail-account-avatar">
                    {profile?.profile_image
                      ? <img src={profile.profile_image} alt="" />
                      : (profile?.name?.charAt(0).toUpperCase() ?? <Users size={16} />)}
                  </span>
                  <span className="app-rail-account-meta app-rail-label">
                    <span className="app-rail-account-name">{profile?.name ?? 'Account'}</span>
                    <span className="app-rail-account-role">{role === 'journalist' ? 'Author' : role === 'admin' ? 'Admin' : 'Reader'}</span>
                  </span>
                </button>
                {accountOpen && (
                  <div className="app-rail-account-menu">
                    <Link href="/settings" onClick={() => setAccountOpen(false)} className="app-rail-menu-item">
                      <Settings size={14} /> Settings
                    </Link>
                    <button onClick={toggleDarkMode} className="app-rail-menu-item">
                      {darkMode ? <Sun size={14} /> : <Moon size={14} />} {darkMode ? 'Light mode' : 'Dark mode'}
                    </button>
                    <button onClick={() => signOut.mutate()} className="app-rail-menu-item danger">
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="app-rail-auth">
                <Link href="/login" onClick={onClose} className="app-rail-auth-btn ghost"><span>Sign in</span></Link>
                <Link href="/onboarding" onClick={onClose} className="app-rail-auth-btn primary"><span>Sign up</span></Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
