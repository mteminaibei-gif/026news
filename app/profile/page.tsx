'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Bookmark, Heart, MessageSquare, Users, PenTool, Settings, ArrowRight, DollarSign, FileText, BarChart3, Share2 } from 'lucide-react'

interface UserProfile {
  user_id: number
  name: string
  role: string
  profile_image: string | null
  email?: string
  created_at?: string
  bio?: string
  rank_score?: number
  total_views?: number
}

const TAB_CONFIG: Record<string, any[]> = {
  reader: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'liked', label: 'Liked', icon: Heart },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'following', label: 'Following', icon: Users },
    { id: 'apply', label: '✍️ Write for Us', icon: PenTool },
  ],
  journalist: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'articles', label: 'My Articles', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'liked', label: 'Liked', icon: Heart },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'articles', label: 'Manage Articles', icon: FileText },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'journalists', label: 'Journalists', icon: Share2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({ articles: 0, saved: 0, following: 0, comments: 0, followers: 0 })

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) {
        router.push('/login?redirect=/profile')
        return
      }
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle()
      if (data) setUser(data)
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  const loadStats = useCallback(async () => {
    if (!user?.user_id) return
    try {
      const [saved, following, comments, articles, followers] = await Promise.all([
        supabase.from('saved_articles').select('*', { count: 'exact', head: true }).eq('user_id', user.user_id),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.user_id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', user.user_id),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', user.user_id),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user.user_id),
      ])
      setStats({
        articles: articles.count ?? 0,
        saved: saved.count ?? 0,
        following: following.count ?? 0,
        comments: comments.count ?? 0,
        followers: followers.count ?? 0,
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }, [user?.user_id, supabase])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (user?.user_id) {
      loadStats()
    }
  }, [user?.user_id, loadStats])

  if (loading) return <LoadingSpinner />
  if (!user) return <div className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>Profile not found</div>

  const tabs = TAB_CONFIG[user.role] || TAB_CONFIG.reader

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <Header user={user} stats={stats} />
        <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabContent user={user} activeTab={activeTab} stats={stats} />
      </div>
    </div>
  )
}

function Header({ user, stats }: { user: UserProfile; stats: any }) {
  const initials = (user.name || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  const handleButtonHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget as HTMLAnchorElement
    if (e.type === 'mouseenter') {
      target.style.background = 'var(--primary-light)'
      target.style.borderColor = 'var(--primary)'
      target.style.color = 'var(--primary)'
    } else {
      target.style.background = 'transparent'
      target.style.borderColor = 'var(--border)'
      target.style.color = 'var(--text-secondary)'
    }
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0 1px 3px var(--card-shadow)',
        marginBottom: '32px',
      }}
      className="animate-fade-up"
    >
      <div className="flex flex-col md:flex-row gap-8">
        <div
          className="w-32 h-32 md:w-24 md:h-24 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold text-white overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            boxShadow: '0 8px 24px rgba(29, 155, 240, 0.2)',
          }}
        >
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {user.name}
            </h1>
            {user.role === 'admin' && (
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'var(--error-light)',
                  color: 'var(--error)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                ADMIN
              </span>
            )}
            {user.role === 'journalist' && (
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                JOURNALIST
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            @{user.name?.toLowerCase().replace(/\s/g, '')} · Member since{' '}
            {user.created_at
              ? new Date(user.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })
              : 'Unknown'}
          </p>
          {user.bio && (
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                marginBottom: '16px',
                lineHeight: '1.6',
                maxWidth: '600px',
              }}
            >
              {user.bio}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatItem label="Following" value={user.role === 'reader' ? 0 : stats.following || 0} />
            <StatItem
              label="Followers"
              value={user.role === 'journalist' ? stats.followers || 0 : stats.saved || 0}
            />
            {user.role !== 'admin' && <StatItem label="Saved" value={stats.saved || 0} />}
            {user.role === 'journalist' && <StatItem label="Articles" value={stats.articles || 0} />}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/settings"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                background: 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonHover}
            >
              <Settings size={16} /> Settings
            </a>
            {user.role === 'journalist' && (
              <a
                href="/journalist/analytics"
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonHover}
              >
                <BarChart3 size={16} /> Analytics
              </a>
            )}
            {user.role === 'admin' && (
              <a
                href="/admin"
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ⚙️ Admin Panel <ArrowRight size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '10px',
        background: 'var(--bg-inset)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  )
}

function TabNavigation({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: any[]
  activeTab: string
  setActiveTab: (tab: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '32px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      } as React.CSSProperties}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: 'none',
              background: 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon size={16} /> {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function TabContent({
  user,
  activeTab,
  stats,
}: {
  user: UserProfile
  activeTab: string
  stats: any
}) {
  return (
    <div className="animate-fade-up">
      {activeTab === 'dashboard' && <DashboardTab user={user} stats={stats} />}
      {activeTab === 'articles' && <ArticlesTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'earnings' && <EarningsTab />}
      {activeTab === 'followers' && <FollowersTab />}
      {activeTab === 'saved' && <SavedTab />}
      {activeTab === 'liked' && <LikedTab />}
      {activeTab === 'comments' && <CommentsTab />}
      {activeTab === 'following' && <FollowingTab stats={stats} />}
      {activeTab === 'apply' && <ApplyTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'journalists' && <JournalistsTab />}
    </div>
  )
}

function DashboardTab({ user, stats }: { user: UserProfile; stats: any }) {
  if (user.role === 'reader') {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Articles Read" value={stats.articles || 0} icon="📖" color="var(--primary)" />
          <Card label="Saved" value={stats.saved || 0} icon="🔖" color="var(--accent)" />
          <Card label="Following" value={stats.following || 0} icon="👥" color="var(--success)" />
          <Card label="Comments" value={stats.comments || 0} icon="💬" color="var(--warning)" />
        </div>
        <EmptyState
          icon="📚"
          title="Welcome, Reader!"
          desc="Explore articles, save favorites, and follow writers"
          cta="Browse Articles"
          ctaLink="/"
        />
      </div>
    )
  }

  if (user.role === 'journalist') {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Published" value={stats.articles || 0} icon="✍️" color="var(--primary)" />
          <Card label="Followers" value={stats.followers || 0} icon="👥" color="var(--accent)" />
          <Card label="Total Views" value={user.total_views || 0} icon="👁️" color="var(--success)" />
          <Card label="Earnings" value="Ksh 0" icon="💰" color="var(--warning)" />
        </div>
        <div className="bg-gradient-to-br from-primary-light to-accent-light rounded-2xl p-8 border border-border-subtle">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Journalist Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Manage your articles and track your success
          </p>
          <a
            href="/journalist/create"
            style={{
              padding: '12px 24px',
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'inline-block',
            }}
          >
            ✍️ Create New Article
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card label="Total Articles" value="1,234" icon="📰" color="var(--primary)" />
        <Card label="Active Users" value="5,678" icon="👥" color="var(--accent)" />
      </div>
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 1px 3px var(--card-shadow)',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Admin Dashboard
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/admin/articles', label: 'Manage Articles', color: 'var(--primary)' },
            { href: '/admin/users', label: 'Manage Users', color: 'var(--accent)' },
            { href: '/admin/journalists', label: 'Journalists', color: 'var(--warning)' },
            { href: '/admin/analytics', label: 'Analytics', color: 'var(--success)' },
          ].map((btn) => (
            <a
              key={btn.href}
              href={btn.href}
              style={{
                padding: '12px 20px',
                background: btn.color,
                color: '#fff',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.9rem',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
            >
              {btn.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function Card({ label, value, icon, color }: any) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 1px 3px var(--card-shadow)',
        transition: 'all 0.3s var(--ease-out-expo)',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadowValue: isHovered ? '0 8px 16px rgba(0,0,0,0.1)' : '0 1px 3px var(--card-shadow)',
      } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color }}>{value}</div>
    </div>
  )
}

function EmptyState({ icon, title, desc, cta, ctaLink }: any) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--accent-light) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '60px 40px',
        textAlign: 'center',
      }}
      className="animate-fade-up"
    >
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{icon}</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>{desc}</p>
      <a
        href={ctaLink}
        style={{
          padding: '12px 28px',
          background: 'var(--primary)',
          color: '#fff',
          borderRadius: '10px',
          textDecoration: 'none',
          fontWeight: 'bold',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'transform 0.2s',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {cta} <ArrowRight size={16} />
      </a>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-base)',
      }}
    >
      <div className="animate-spin" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--primary-light)', borderTopColor: 'var(--primary)' }} />
    </div>
  )
}

function ArticlesTab() {
  return (
    <EmptyState
      icon="📝"
      title="My Articles"
      desc="Your articles will appear here"
      cta="Create Article"
      ctaLink="/journalist/create"
    />
  )
}
function AnalyticsTab() {
  return (
    <EmptyState
      icon="📊"
      title="Analytics"
      desc="Track your article performance and reader engagement"
      cta="View Full Analytics"
      ctaLink="/journalist/analytics"
    />
  )
}
function EarningsTab() {
  return (
    <EmptyState
      icon="💰"
      title="Earnings"
      desc="Monitor your revenue and payouts"
      cta="View Earnings"
      ctaLink="/journalist/earnings"
    />
  )
}
function FollowersTab() {
  return (
    <EmptyState
      icon="👥"
      title="Followers"
      desc="See who is following your content"
      cta="Explore"
      ctaLink="/"
    />
  )
}
function SavedTab() {
  return (
    <EmptyState
      icon="🔖"
      title="Saved Articles"
      desc="Articles you save will appear here"
      cta="Start Exploring"
      ctaLink="/"
    />
  )
}
function LikedTab() {
  return (
    <EmptyState
      icon="❤️"
      title="Liked Articles"
      desc="Articles you like will appear here"
      cta="Browse"
      ctaLink="/"
    />
  )
}
function CommentsTab() {
  return (
    <EmptyState
      icon="💬"
      title="Comments"
      desc="Your comments will appear here"
      cta="Read Articles"
      ctaLink="/articles"
    />
  )
}
function FollowingTab({ stats }: { stats: any }) {
  return (
    <EmptyState
      icon="👥"
      title="Following"
      desc={`You're following ${stats.following || 0} writers`}
      cta="Explore Writers"
      ctaLink="/journalists"
    />
  )
}
function ApplyTab() {
  return (
    <EmptyState
      icon="✍️"
      title="Become a Journalist"
      desc="Share your stories and earn revenue from your content"
      cta="Apply Now"
      ctaLink="/auth/apply-journalist"
    />
  )
}
function UsersTab() {
  return (
    <EmptyState
      icon="👤"
      title="Manage Users"
      desc="View and manage platform users"
      cta="Go to Users"
      ctaLink="/admin/users"
    />
  )
}
function JournalistsTab() {
  return (
    <EmptyState
      icon="👥"
      title="Manage Journalists"
      desc="Review journalist applications and manage authors"
      cta="Go to Journalists"
      ctaLink="/admin/journalists"
    />
  )
}
