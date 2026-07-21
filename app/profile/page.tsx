'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser, useProfile } from '@/lib/hooks/useAuth'
import { useUserPosts, usePosts } from '@/lib/hooks/usePosts'
import { PostCard } from '@/components/social/PostCard'
import {
  Settings, Edit3, FileText, Bookmark, Heart, MessageSquare,
  Users, Newspaper, Radio, Tv, Compass, Calendar, ExternalLink, BookmarkCheck,
  Activity, Eye, ThumbsUp,
} from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Social Feed', href: '/social', icon: Users, desc: 'See what people are saying' },
  { label: 'Explore', href: '/explore', icon: Compass, desc: 'Discover trending topics' },
  { label: 'News', href: '/news', icon: Newspaper, desc: 'Latest breaking stories' },
  { label: 'Radio', href: '/radio', icon: Radio, desc: 'Listen live' },
  { label: 'TV', href: '/tv', icon: Tv, desc: 'Watch live streams' },
  { label: 'Communities', href: '/communities', icon: Users, desc: 'Join a community' },
]

const PROFILE_TABS = [
  { id: 'posts', label: 'My Posts', icon: FileText },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'liked', label: 'Liked', icon: Heart },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
]

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { data: authUser } = useUser()
  const { data: profile } = useProfile(authUser?.email ?? undefined)

  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && PROFILE_TABS.some(tab => tab.id === t)) setActiveTab(t)
  }, [searchParams])

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser?.id) { router.push('/login?redirect=/social'); return }
        const { data } = await supabase.from('users').select('*').eq('auth_id', authUser.id).maybeSingle()
        if (data) setUser(data)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    })()
  }, [supabase, router])

  const { posts: myPosts, loading: myLoading } = useUserPosts(user?.user_id ?? null)

  const toggleLike = useCallback(async (postId: number) => {
    setAllPosts(prev => prev.map(p => p.post_id === postId
      ? { ...p, liked: !p.liked, like_count: p.like_count + (p.liked ? -1 : 1) }
      : p))
  }, [])

  const [allPosts, setAllPosts] = useState<any[]>([])
  useEffect(() => { setAllPosts(myPosts) }, [myPosts])

  if (loading) {
    return (
      <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="page-spinner" />
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Profile not found.</p>
      </div>
    )
  }

  const role = (user.role as string) ?? 'reader'
  const memberSince = new Date(user.created_at ?? Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const roleBadge =
    role === 'journalist' ? { label: 'Author', color: 'oklch(65% 0.12 145)', bg: 'oklch(65% 0.12 145 / 0.15)' } :
    role === 'admin' ? { label: 'Admin', color: 'oklch(72% 0.16 55)', bg: 'oklch(72% 0.16 55 / 0.15)' } :
    { label: 'Reader', color: '#1d9bf0', bg: 'rgba(29,155,240,0.15)' }

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-hero-content">
          <div className="profile-hero-avatar">
            {user.profile_image ? (
              <img src={user.profile_image} alt={user.name} />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="profile-hero-info">
            <div className="profile-hero-name-row">
              <h1 className="profile-hero-name">{user.name}</h1>
              <span className="profile-hero-role"
                style={{ background: roleBadge.bg, color: roleBadge.color, border: `1px solid ${roleBadge.color}` }}>{roleBadge.label}</span>
            </div>
            <p className="profile-hero-handle">@{user.name.toLowerCase().replace(/\s+/g, '')}</p>
            {user.bio && <p className="profile-hero-bio">{user.bio}</p>}
            <div className="profile-stats-row" style={{ marginTop: '0.8rem' }}>
              <span style={statBadge}>
                <Activity size={13} /> {myPosts.length} posts
              </span>
              <span style={statBadge}>
                <Eye size={13} /> Joined {memberSince}
              </span>
              <span style={statBadge}>
                <ThumbsUp size={13} /> Active
              </span>
            </div>
          </div>
          <div className="profile-hero-actions">
            <button className="profile-hero-btn primary" onClick={() => router.push('/settings')}>
              <Settings size={15} /> Settings
            </button>
            <button className="profile-hero-btn" onClick={() => router.push('/settings')}>
              <Edit3 size={15} /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="profile-container">
        <main className="profile-main">
          <div className="profile-quick-links">
            <h3 className="profile-sidebar-title" style={{ marginBottom: '0.75rem' }}>Quick Links</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem' }}>
              {QUICK_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="profile-quick-card"
                >
                  <link.icon size={18} />
                  <span className="profile-quick-card-label">{link.label}</span>
                  <span className="profile-quick-card-desc">{link.desc}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="profile-tabs">
            {PROFILE_TABS.map(tab => (
              <button
                key={tab.id}
                className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="profile-feed">
            {activeTab === 'posts' && (
              myLoading ? (
                <p className="profile-empty">Loading your posts.</p>
              ) : allPosts.length === 0 ? (
                <div className="profile-empty-state">
                  <FileText size={32} />
                  <p>You haven&apos;t shared anything yet.</p>
                  <Link href="/social" className="profile-empty-link">Share your first thought on Social</Link>
                </div>
              ) : (
                allPosts.map(p => <PostCard key={p.post_id} post={p} onToggleLike={toggleLike} />)
              )
            )}

            {activeTab === 'saved' && <ProfileSavedPostsTab />}

            {activeTab === 'liked' && (
              <div className="profile-empty-state">
                <Heart size={32} />
                <p>Liked posts will appear here.</p>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="profile-empty-state">
                <MessageSquare size={32} />
                <p>Your comments on articles will appear here.</p>
              </div>
            )}
          </div>
        </main>

        <aside className="profile-sidebar">
          <div className="profile-sidebar-card">
            <h3 className="profile-sidebar-title">About</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={aboutRowStyle}>
                <span style={aboutLabelStyle}>Posts</span>
                <span style={aboutValueStyle}>{myPosts.length}</span>
              </div>
              <div style={aboutRowStyle}>
                <span style={aboutLabelStyle}>Member since</span>
                <span style={aboutValueStyle}>{memberSince}</span>
              </div>
              <div style={aboutRowStyle}>
                <span style={aboutLabelStyle}>Role</span>
                <span style={{ ...aboutValueStyle, color: roleBadge.color }}>{roleBadge.label}</span>
              </div>
              {user.bio && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>{user.bio}</p>}
            </div>
          </div>
          <div className="profile-sidebar-card">
            <h3 className="profile-sidebar-title">Community Guidelines</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              Be respectful. Share verified news. Tag topics with #hashtags. Engage with the community.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

const statBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'oklch(80% 0.03 200 / 0.8)',
  background: 'oklch(100% 0 0 / 0.08)',
  border: '1px solid oklch(100% 0 0 / 0.1)',
  borderRadius: 999,
  padding: '4px 10px',
}

const aboutRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const aboutLabelStyle = {
  color: 'var(--text-tertiary)'
}

const aboutValueStyle = {
  color: 'var(--text-primary)',
  fontWeight: 600,
}

function ProfileSavedPostsTab() {
  const { posts, loading } = usePosts('saved')
  if (loading) return <p className="profile-empty">Loading saved posts.</p>
  if (posts.length === 0) return (
    <div className="profile-empty-state">
      <BookmarkCheck size={32} />
      <p>No saved posts yet.</p>
      <Link href="/social" className="profile-empty-link">Browse Social to find posts to save</Link>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {posts.map(p => <PostCard key={p.post_id} post={p} onToggleLike={() => {}} />)}
    </div>
  )
}
