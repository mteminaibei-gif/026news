'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Bell, Bookmark, PenLine, LogOut, Sun, Moon, Settings, BarChart3,
  LayoutDashboard, DollarSign, Star, Newspaper, FileText, Users, UsersRound,
  TrendingUp, Eye, Award, UserCheck, Tag, Globe, PenTool, Mail, Compass, Radio, Tv, BookOpen,
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
  color?: string
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  active: { x: 4, transition: { duration: 0.15 } },
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
    { href: '/social', label: 'Feed', Icon: Users, match: p => p.startsWith('/social'), color: '#3b82f6' },
    { href: '/profile', label: 'My Profile', Icon: Settings, match: p => p.startsWith('/profile') || p.startsWith('/stats'), color: '#6366f1' },
    { href: '/inbox', label: 'Messages', Icon: MessageSquare, badge: unreadMessages, color: '#8b5cf6' },
    ...(role !== 'admin' ? [{ href: '/notifications', label: 'Notifications', Icon: Bell, badge: unreadCount, color: '#f59e0b' }] : []),
    { href: '/saved', label: 'Saved', Icon: Bookmark, match: p => p.startsWith('/saved'), color: '#ef4444' },
    { href: '/communities', label: 'Communities', Icon: UsersRound, match: p => p.startsWith('/communities'), color: '#10b981' },
    { href: '/people', label: 'People', Icon: UsersRound, match: p => p.startsWith('/people'), color: '#06b6d4' },
  ]

  const discover: NavItem[] = [
    { href: '/rankings', label: 'Rankings', Icon: Award, match: p => p.startsWith('/rankings'), color: '#f59e0b' },
    { href: '/leaderboard', label: 'Leaderboard', Icon: TrendingUp, match: p => p.startsWith('/leaderboard'), color: '#10b981' },
    { href: '/radio', label: 'Radio', Icon: Radio, match: p => p.startsWith('/radio'), color: '#ef4444' },
    { href: '/tv', label: 'TV', Icon: Tv, match: p => p.startsWith('/tv'), color: '#8b5cf6' },
    { href: '/how-to', label: 'How To', Icon: BookOpen, match: p => p.startsWith('/how-to'), color: '#06b6d4' },
  ]

  const studio = role === 'journalist'
    ? [
        { href: '/journalist', label: 'Overview', Icon: BarChart3, match: (p: string) => p === '/journalist' && !activeTab, color: '#3b82f6' },
        { href: '/journalist/create', label: 'Write Article', Icon: PenLine, match: (p: string) => p.startsWith('/journalist/create') || p.startsWith('/journalist/edit'), color: '#10b981' },
        { href: '/journalist?tab=articles', label: 'My Articles', Icon: FileText, match: () => activeTab === 'articles', color: '#8b5cf6' },
        { href: '/journalist?tab=analytics', label: 'Analytics', Icon: TrendingUp, match: () => activeTab === 'analytics', color: '#f59e0b' },
        { href: '/journalist?tab=earnings', label: 'Earnings', Icon: DollarSign, match: () => activeTab === 'earnings', color: '#10b981' },
        { href: '/journalist?tab=followers', label: 'Followers', Icon: Users, match: () => activeTab === 'followers', color: '#06b6d4' },
        { href: '/journalist?tab=subscribers', label: 'Subscribers', Icon: Bell, match: () => activeTab === 'subscribers', color: '#ef4444' },
        { href: '/journalist?tab=profile', label: 'Profile', Icon: Settings, match: () => activeTab === 'profile', color: '#6366f1' },
      ]
    : role === 'admin'
      ? [
          { href: '/admin', label: 'Overview', Icon: LayoutDashboard, match: (p: string) => p === '/admin', color: '#3b82f6' },
          { href: '/admin/articles', label: 'Articles', Icon: FileText, match: (p: string) => p.startsWith('/admin/articles') || p.startsWith('/admin/edit'), color: '#8b5cf6' },
          { href: '/admin/journalists', label: 'Authors', Icon: Users, match: (p: string) => p.startsWith('/admin/journalists'), color: '#06b6d4' },
          { href: '/admin/users', label: 'Users', Icon: UserCheck, match: (p: string) => p.startsWith('/admin/users'), color: '#10b981' },
          { href: '/admin/reviews', label: 'Reviews', Icon: Star, match: (p: string) => p.startsWith('/admin/reviews') || p.startsWith('/admin/review'), color: '#f59e0b' },
          { href: '/admin/analytics', label: 'Analytics', Icon: TrendingUp, match: (p: string) => p.startsWith('/admin/analytics'), color: '#ef4444' },
          { href: '/admin/tracking', label: 'Live Traffic', Icon: Eye, match: (p: string) => p.startsWith('/admin/tracking'), color: '#f97316' },
          { href: '/admin/earnings', label: 'Earnings', Icon: DollarSign, match: (p: string) => p.startsWith('/admin/earnings'), color: '#10b981' },
          { href: '/admin/sources', label: 'Sources', Icon: Globe, match: (p: string) => p.startsWith('/admin/sources'), color: '#8b5cf6' },
          { href: '/admin/categories', label: 'Categories', Icon: Tag, match: (p: string) => p.startsWith('/admin/categories'), color: '#f59e0b' },
          { href: '/admin/notifications', label: 'Notifications', Icon: Bell, match: (p: string) => p.startsWith('/admin/notifications'), color: '#ef4444' },
          { href: '/admin/settings', label: 'Settings', Icon: Settings, match: (p: string) => p.startsWith('/admin/settings'), color: '#6366f1' },
          { href: '/admin/write', label: 'Write Article', Icon: PenTool, match: (p: string) => p.startsWith('/admin/write'), color: '#10b981' },
        ]
      : []

  const SideLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item)
    const isSamePage = pathname === item.href || pathname.startsWith(item.href + '?')
    return (
      <motion.div variants={itemVariants} custom={active ? 'active' : 'show'}>
        <Link
          href={item.href}
          data-tour={
            item.href === '/social' ? 'social-feed' :
            item.href === '/explore' ? 'explore' :
            item.href.startsWith('/inbox') ? 'messages' :
            item.href === '/news' || item.href === '/articles' ? 'news' :
            item.href === '/profile' ? 'profile' :
            undefined
          }
          onClick={(e) => {
            if (isSamePage) {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
            onClose()
          }}
          className={`app-rail-link ${active ? 'active' : ''}`}
          aria-current={active ? 'page' : undefined}
        >
          <span className={`app-rail-icon ${item.color ? 'colored' : ''}`} style={item.color ? { '--icon-color': item.color } as React.CSSProperties : undefined}>
            <motion.div animate={{ scale: active ? 1.1 : 1 }} transition={{ duration: 0.15 }}>
              <item.Icon size={18} />
            </motion.div>
            {item.badge ? (
              <motion.span
                className="app-rail-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 17 }}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </motion.span>
            ) : null}
          </span>
          <span className="app-rail-label">{item.label}</span>
        </Link>
      </motion.div>
    )
  }

  const SectionLabel = ({ label }: { label: string }) => (
    <motion.div
      className="app-rail-section-label"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {label}
    </motion.div>
  )

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="scrim"
          aria-hidden="true"
          onClick={onClose}
          className={mobileOpen ? 'app-rail-scrim show' : 'app-rail-scrim'}
          initial={{ opacity: 0 }}
          animate={{ opacity: mobileOpen ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />

        <motion.aside
          key="sidebar"
          className={`app-rail ${mobileOpen ? 'open' : ''}`}
          aria-label="Personal"
        >
          <div className="app-rail-inner">
            <motion.div
              className="app-rail-nav"
              aria-label="Personal"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <SectionLabel label="Personal" />
              {personal.map(i => <SideLink key={i.href} item={i} />)}
            </motion.div>

            <motion.div
              className="app-rail-sep"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            />
            <motion.div
              className="app-rail-nav"
              aria-label="Discover"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <SectionLabel label="Discover" />
              {discover.map(i => <SideLink key={i.href} item={i} />)}
            </motion.div>

            {studio.length > 0 && (
              <>
                <motion.div
                  className="app-rail-sep"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                />
                <motion.div
                  className="app-rail-nav"
                  aria-label="Studio"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <SectionLabel label={role === 'admin' ? 'Admin' : 'Studio'} />
                  {studio.map((i: any) => <SideLink key={i.href} item={i} />)}
                </motion.div>
              </>
            )}

            <motion.div
              className="app-rail-bottom"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {user ? (
                <motion.div className="app-rail-account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.35 }}>
                  <button className="app-rail-account-btn" onClick={() => setAccountOpen(v => !v)}>
                    <motion.span
                      className="app-rail-account-avatar"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {profile?.profile_image
                        ? <img src={profile.profile_image} alt="" />
                        : (profile?.name?.charAt(0).toUpperCase() ?? <Users size={16} />)}
                    </motion.span>
                    <span className="app-rail-account-meta app-rail-label">
                      <span className="app-rail-account-name">{profile?.name ?? 'Account'}</span>
                      <span className="app-rail-account-role">{role === 'journalist' ? 'Author' : role === 'admin' ? 'Admin' : 'Reader'}</span>
                    </span>
                  </button>
                  {accountOpen && (
                    <AnimatePresence>
                      <motion.div
                        className="app-rail-account-menu"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Link href="/settings" onClick={() => setAccountOpen(false)} className="app-rail-menu-item">
                          <Settings size={14} /> Settings
                        </Link>
                        <motion.button
                          onClick={toggleDarkMode}
                          className="app-rail-menu-item"
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {darkMode ? <Sun size={14} /> : <Moon size={14} />} {darkMode ? 'Light mode' : 'Dark mode'}
                        </motion.button>
                        <motion.button
                          onClick={() => signOut.mutate()}
                          className="app-rail-menu-item danger"
                          whileHover={{ x: 4, backgroundColor: '#fee2e2' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <LogOut size={14} /> Sign out
                        </motion.button>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>
              ) : (
                <motion.div className="app-rail-auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.35 }}>
                  <motion.a
                    href="/login"
                    onClick={onClose}
                    className="app-rail-auth-btn ghost"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Sign in</span>
                  </motion.a>
                  <motion.a
                    href="/onboarding"
                    onClick={onClose}
                    className="app-rail-auth-btn primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Sign up</span>
                  </motion.a>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.aside>
      </AnimatePresence>
    </>
  )
}
