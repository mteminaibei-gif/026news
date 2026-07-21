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
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              <span className="profile-hero-role">{role === 'journalist' ? 'Author' : role === 'admin' ? 'Admin' : 'Reader'}</span>
            </div>
            <p className="profile-hero-handle">@{user.name.toLowerCase().replace(/\s+/g, '')}</p>
            {user.bio && <p className="profile-hero-bio">{user.bio}</p>}
            <div className="profile-hero-meta">
              <span><Calendar size={14} /> Joined {memberSince}</span>
              <span><FileText size={14} /> {myPosts.length} posts</span>
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
            <h3 className="profile-sidebar-title" style={{ marginBottom: '0.5rem' }}>Quick Links</h3>
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
                <p className="profile-empty">Loading your posts…</p>
              ) : allPosts.length === 0 ? (
                <div className="profile-empty-state">
                  <FileText size={32} />
                  <p>You haven&apos;t posted anything yet.</p>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span><strong style={{ color: 'var(--text-primary)' }}>{myPosts.length}</strong> posts</span>
              <span>Member since {memberSince}</span>
              {user.bio && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{user.bio}</p>}
            </div>
          </div>
          <div className="profile-sidebar-card">
            <h3 className="profile-sidebar-title">Guidelines</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Be respectful. Share verified news. Tag topics with #hashtags. Engage with the community.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ProfileSavedPostsTab() {
  const { posts, loading } = usePosts('saved')
  if (loading) return <p className="profile-empty">Loading saved posts…</p>
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
