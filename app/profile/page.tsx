// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Heart, Bookmark, MessageSquare, Bell, Settings, Send, ThumbsUp, Reply, Star, BarChart3 } from 'lucide-react'
import { ProfileNav } from '@/components/layout/ProfileNav'

interface UserProfile {
  name: string; role: string; email?: string; created_at?: string
  is_verified?: boolean; profile_image?: string | null; avatar_url?: string | null; user_id?: number
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('saved')

  const [savedArticles, setSaved] = useState([])
  const [likedArticles, setLiked] = useState([])
  const [comments, setComments] = useState([])
  const [following, setFollowing] = useState([])
  const [conversations, setConversations] = useState([])
  const [notifs, setNotifs] = useState([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messageDraft, setMessageDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [readingData, setReadingData] = useState([0, 0, 0, 0, 0, 0, 0])
  const [interests, setInterests] = useState<string[]>([])
  const [stats, setStats] = useState({ articles: 0, saved: 0, following: 0, comments: 0 })

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (userId === null) return
    loadSaved()
    loadLiked()
    loadComments()
    loadNotifs()
    loadFollowing()
    loadConversations()
    loadStats()
    loadInterests()
    loadReadingActivity()
  }, [userId])

  const loadProfile = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      // No valid session (stale/expired cookie, or none) — send the
      // reader to login rather than rendering a broken/empty profile.
      if (authError || !authUser?.id) {
        if (typeof window !== 'undefined') router.push('/login?redirect=/profile')
        return
      }
      const { data } = await supabase.from('users').select('*').eq('auth_id', authUser.id).maybeSingle()
      const p = data as any
      if (p) {
        setUser(p as UserProfile)
        setUserId(p.user_id)
        return
      }
      // No users row yet — ask the server to create it (server-side,
      // bypasses RLS so it always succeeds for a valid session).
      try {
        const res = await fetch('/api/profile/ensure', { method: 'POST' })
        if (res.ok) {
          const { profile } = await res.json()
          if (profile) {
            setUser(profile as UserProfile)
            setUserId((profile as any).user_id)
            return
          }
        }
      } catch {}
      // Last-resort fallback so the page still renders.
      setUser({
        name: (authUser.user_metadata?.name as string) || (authUser.email ? authUser.email.split('@')[0] : 'Reader'),
        role: (authUser.user_metadata?.role as string) || 'reader',
        email: authUser.email ?? undefined,
        profile_image: (authUser.user_metadata?.avatar_url as string) || null,
        created_at: authUser.created_at,
      })
      setUserId(null)
    } catch {
      setUser({ name: 'Reader', role: 'reader' })
      setUserId(null)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!userId) return
    try {
      const [saved, following, comments, articles] = await Promise.all([
        supabase.from('saved_articles').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', userId),
      ])
      setStats({
        articles: articles.count ?? 0,
        saved: saved.count ?? 0,
        following: following.count ?? 0,
        comments: comments.count ?? 0,
      })
    } catch {}
  }

  const loadInterests = async () => {
    try {
      const { data: cats } = await supabase.from('categories').select('name').limit(8)
      if (cats && cats.length > 0) {
        setInterests(cats.map((c: any) => c.name))
      } else {
        const stored = localStorage.getItem('026-interests')
        if (stored) setInterests(JSON.parse(stored))
      }
    } catch {
      const stored = localStorage.getItem('026-interests')
      if (stored) setInterests(JSON.parse(stored))
    }
  }

  const loadReadingActivity = async () => {
    if (!userId) return
    try {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
      monday.setHours(0, 0, 0, 0)

      const [savedRes, likedRes] = await Promise.all([
        supabase.from('saved_articles').select('saved_at').eq('user_id', userId).gte('saved_at', monday.toISOString()),
        supabase.from('article_likes').select('created_at').eq('user_id', userId).gte('created_at', monday.toISOString()),
      ])

      const dailyCounts = [0, 0, 0, 0, 0, 0, 0]
      const allDates = [
        ...(savedRes.data || []).map((s: any) => s.saved_at),
        ...(likedRes.data || []).map((l: any) => l.created_at),
      ]
      for (const dateStr of allDates) {
        const d = new Date(dateStr)
        const diffDays = Math.floor((d.getTime() - monday.getTime()) / 86400000)
        if (diffDays >= 0 && diffDays < 7) dailyCounts[diffDays]++
      }
      setReadingData(dailyCounts)
    } catch {}
  }

  const loadSaved = async () => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('saved_articles')
        .select('article_id, saved_at, articles!inner(article_id, title, slug, featured_image, excerpt, status, author_id, reading_time_minutes, created_at, author:users(name), category:categories(name))')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false })
        .limit(10)
      setSaved((data as any[]) || [])
    } catch {
      setSaved([])
    }
  }

  const loadLiked = async () => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('article_likes')
        .select('article_id, created_at, articles!inner(article_id, title, slug, featured_image, excerpt, status, reading_time_minutes, created_at, author:users(name), category:categories(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      setLiked((data as any[]) || [])
    } catch {
      setLiked([])
    }
  }

  const loadComments = async () => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('comments')
        .select('comment_id, comment_text, created_at, article_id, articles!inner(article_id, title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      setComments((data as any[]) || [])
    } catch {
      setComments([])
    }
  }

  const loadNotifs = async () => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
      setNotifs((data as any[]) || [])
    } catch {
      setNotifs([])
    }
  }

  const loadFollowing = async () => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('user_follows')
        .select('following_id, users!inner(user_id, name, role, profile_image, total_views)')
        .eq('follower_id', userId)
        .limit(10)
      setFollowing((data as any[]) || [])
    } catch {
      setFollowing([])
    }
  }

  const loadConversations = async () => {
    if (!userId) return
    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at, is_read')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50)
      if (!msgs?.length) { setConversations([]); return }

      const convMap = new Map()
      for (const msg of msgs) {
        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
        if (otherId === userId) continue
        if (!convMap.has(otherId)) {
          const { data: u } = await supabase.from('users').select('user_id, name, profile_image, role').eq('user_id', otherId).single()
          const fallback = { user_id: otherId, name: 'Unknown', profile_image: null, role: 'user' }
          convMap.set(otherId, {
            other_user: u || fallback,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread: msg.sender_id !== userId && !msg.is_read ? 1 : 0,
          })
        }
      }
      setConversations(Array.from(convMap.values()).slice(0, 5) as any)
    } catch { setConversations([]) }
  }

  const getInitialsSafe = (name?: string | null) => {
    const n = (name || '').trim()
    if (!n) return 'U'
    return n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'
  }
  const initials = getInitialsSafe(user?.name)
  const displayName = user?.name || 'Reader'

  const getNotificationDisplay = (n: any) => {
    const name = n?.actor_name || n?.sender_name || 'Someone'
    const inits = getInitialsSafe(name)
    const colors = ['oklch(50% 0.14 200)', 'oklch(50% 0.14 320)', 'oklch(50% 0.14 90)', 'oklch(50% 0.14 30)', 'oklch(50% 0.14 350)']
    const color = colors[(n.notification_id || 0) % colors.length]
    const timeAgo = getTimeAgo(n.created_at)
    const isUnread = !n.is_read
    let text = ''
    if (n.type === 'article_published') text = `<strong>${name}</strong> published a new article`
    else if (n.type === 'comment_reply') text = `<strong>${name}</strong> replied to your comment`
    else if (n.type === 'comment_like') text = `<strong>${name}</strong> liked your comment`
    else if (n.type === 'follow') text = `<strong>${name}</strong> started following you`
    else text = n.message || `<strong>${name}</strong> sent you a notification`
    return { id: n.notification_id, initials: inits, color, text, time: timeAgo, unread: isUnread }
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getFollowingDisplay = (f: any) => {
    const u = f.users
    const name = u?.name || 'Unknown'
    const inits = getInitialsSafe(name)
    const colors = ['oklch(50% 0.14 200)', 'oklch(50% 0.14 30)', 'oklch(50% 0.14 350)', 'oklch(50% 0.14 140)']
    const color = colors[(f.following_id || 0) % colors.length]
    const views = u?.total_views ? `${Math.round(u.total_views / 1000)}K views` : ''
    const role = u?.role ? `${u.role}${views ? ' · ' + views : ''}` : views || 'Reader'
    return { name, initials: inits, color, role }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Profile Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 0' }}>
        <div className="profile-header" style={{ marginBottom: 32 }}>
          <div style={{ width: 96, height: 96, borderRadius: 24, background: user?.profile_image ? 'transparent' : 'linear-gradient(135deg, oklch(50% 0.15 175), oklch(45% 0.12 220))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'oklch(98% 0.005 175)', flexShrink: 0, overflow: 'hidden' }}>
            {user?.profile_image ? (
              <img src={user.profile_image} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>{displayName}</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', marginBottom: 10 }}>@{displayName.toLowerCase().replace(/\s/g, '')} · Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '55ch', lineHeight: 1.55, marginBottom: 16 }}>
              {user?.bio || 'No bio yet.'}
            </p>
            <div className="profile-stats-row" style={{ fontSize: '0.82rem' }}>
              <span><strong style={{ fontWeight: 700 }}>{stats.articles}</strong> <span style={{ color: 'var(--text-tertiary)' }}>articles read</span></span>
              <span><strong style={{ fontWeight: 700 }}>{stats.saved}</strong> <span style={{ color: 'var(--text-tertiary)' }}>saved</span></span>
              <span><strong style={{ fontWeight: 700 }}>{stats.following}</strong> <span style={{ color: 'var(--text-tertiary)' }}>following</span></span>
              <span><strong style={{ fontWeight: 700 }}>{stats.comments}</strong> <span style={{ color: 'var(--text-tertiary)' }}>comments</span></span>
            </div>
          </div>
          <div className="profile-header-actions">
            <Link href="/settings" style={{ padding: '9px 18px', borderRadius: 9, fontSize: '0.82rem', fontWeight: 600, border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Settings size={15} /> Settings
            </Link>
            <Link href="/stats" style={{ padding: '9px 18px', borderRadius: 9, fontSize: '0.82rem', fontWeight: 600, border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <BarChart3 size={15} /> Stats
            </Link>
            <Link href="/settings" style={{ padding: '9px 18px', borderRadius: 9, fontSize: '0.82rem', fontWeight: 600, border: 'none', color: 'oklch(98% 0.005 175)', background: 'var(--primary)', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'saved', label: 'Saved', icon: Bookmark, count: stats.saved },
            { id: 'liked', label: 'Liked', icon: Heart, count: likedArticles.length },
            { id: 'comments', label: 'Comments', icon: MessageSquare, count: stats.comments },
            { id: 'history', label: 'History', icon: null, count: null },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`profile-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              style={{ fontWeight: activeTab === tab.id ? 600 : 500, color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-tertiary)' }}>
              {tab.icon && <tab.icon size={15} />}
              {tab.label}
              {tab.count != null && (
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: activeTab === tab.id ? 'var(--primary-light)' : 'var(--bg-inset)', color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-tertiary)' }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }} className="profile-layout">
        {/* Profile Nav */}
        <aside style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          <ProfileNav role="reader" />
        </aside>

        <main>
          {/* Journalist application status */}
          {user && (user as any).author_application?.status === 'pending' && (
            <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--warning-light)', color: 'var(--warning)', border: '1px solid var(--warning-light)' }}>
              <span style={{ fontSize: '1.1rem' }}>⏳</span>
              <span>Your journalist application is under review by our editorial team. We&apos;ll notify you once a decision is made.</span>
            </div>
          )}
          {user && (user as any).author_application?.status === 'approved' && (
            <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success-light)' }}>
              <span style={{ fontSize: '1.1rem' }}>✅</span>
              <span>Your journalist application was approved! You can now publish articles. <Link href="/journalist/create" style={{ color: 'var(--success)', fontWeight: 600, textDecoration: 'underline' }}>Create your first article</Link></span>
            </div>
          )}
          {user && (user as any).author_application?.status === 'declined' && (
            <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--error-light)', color: 'var(--error)', border: '1px solid var(--error-light)' }}>
              <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
              <span>Your journalist application was not approved{(user as any).author_application?.reason ? `: ${(user as any).author_application.reason}` : ''}. You can apply again anytime.</span>
            </div>
          )}

          {/* Saved Tab */}
          {activeTab === 'saved' && (
            <div className="profile-tab-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {savedArticles.length === 0 && (
                <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
                  <Bookmark size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 12, opacity: 0.5 }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No saved articles yet</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', marginBottom: 16 }}>Save articles to read them later and keep track of what matters to you.</p>
                  <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, fontSize: '0.82rem', fontWeight: 600, background: 'var(--primary)', color: 'oklch(98% 0.005 175)', textDecoration: 'none' }}>
                    Browse Articles
                  </Link>
                </div>
              )}
              {savedArticles.map((a: any, i) => {
                const article = a.articles || a
                return (
                  <div key={i} className="profile-article-card" style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, transition: 'all 0.25s', cursor: 'pointer' }}>
                    <Link href={`/article/${article.slug || '#'}`} style={{ flex: '0 0 140px', textDecoration: 'none' }}>
                      <Image src={article.featured_image || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=200&fit=crop'} alt={article.title} width={140} height={100} style={{ borderRadius: 9, objectFit: 'cover', width: '100%', height: 100 }} unoptimized />
                    </Link>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>{a.categories?.name || article.categories?.name || 'Technology'}</span>
                        <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.35, margin: '6px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          <Link href={`/article/${article.slug || '#'}`} style={{ color: 'inherit', textDecoration: 'none' }}>{article.title}</Link>
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.users?.name || article.users?.name || 'Staff'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Saved {a.saved_at ? new Date(a.saved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} · {article.reading_time_minutes || 5} min read</div>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!a.saved_id) return
                            try {
                              await fetch('/api/saved-articles', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ saved_id: a.saved_id }),
                              })
                              setSaved((prev: any[]) => prev.filter((s: any) => s.saved_id !== a.saved_id))
                              setStats((prev: any) => ({ ...prev, saved: Math.max(0, prev.saved - 1) }))
                            } catch {}
                          }}
                          style={{
                            width: 28, height: 28, borderRadius: 6,
                            border: '1px solid var(--border-subtle)',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-tertiary)',
                            transition: 'all 0.15s',
                          }}
                          title="Remove from saved"
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--error-light)'; e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.borderColor = 'var(--error-light)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
                        >
                          <Bookmark size={13} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Liked Tab */}
          {activeTab === 'liked' && (
            <div className="profile-tab-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {likedArticles.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>No liked articles yet.</p>}
              {likedArticles.map((a: any, i) => {
                const article = a.articles || a
                return (
                  <Link key={i} href={`/article/${article.slug || '#'}`} className="profile-article-card" style={{ padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, textDecoration: 'none', color: 'inherit', transition: 'all 0.25s', cursor: 'pointer', opacity: 0.85 }}>
                    <Image src={article.featured_image || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&h=200&fit=crop'} alt={article.title} width={140} height={100} style={{ borderRadius: 9, objectFit: 'cover', width: '100%', height: 100 }} unoptimized />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>{a.categories?.name || article.categories?.name || 'Features & Profiles'}</span>
                        <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.35, margin: '6px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.users?.name || article.users?.name || 'Staff'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Liked {a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} · {article.reading_time_minutes || 5} min read</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="card-action liked" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--error-light)', background: 'var(--error-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
                            <Heart size={13} fill="currentColor" />
                          </button>
                          <button className="card-action" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                            <Bookmark size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="profile-tab-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {comments.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>No comments yet.</p>}
              {comments.map((c: any) => (
                <div key={c.comment_id} style={{ padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={12} /> Commented on <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{c.articles?.title || 'an article'}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--text-primary)', marginBottom: 10 }}>{c.comment_text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    <span>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="profile-tab-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {likedArticles.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>No reading history yet.</p>}
              {likedArticles.slice(0, 5).map((a: any, i: number) => {
                const article = a.articles || a
                return (
                  <Link key={i} href={`/article/${article.slug || '#'}`} className="profile-article-card" style={{ padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, textDecoration: 'none', color: 'inherit', transition: 'all 0.25s', cursor: 'pointer', opacity: 0.85 }}>
                    <Image src={article.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&h=200&fit=crop'} alt={article.title} width={140} height={100} style={{ borderRadius: 9, objectFit: 'cover', width: '100%', height: 100 }} unoptimized />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>{a.categories?.name || article.categories?.name || ''}</span>
                        <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.35, margin: '6px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.users?.name || article.users?.name || 'Staff'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Liked {a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} · {article.reading_time_minutes || 5} min read</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Notifications */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} style={{ color: 'var(--accent)' }} /> Notifications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifs.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>No notifications.</p>}
              {notifs.map((n: any) => {
                const display = getNotificationDisplay(n)
                return (
                  <div key={display.id} style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 9, background: display.unread ? 'var(--bg-inset)' : 'transparent', cursor: 'pointer', position: 'relative', paddingLeft: display.unread ? 16 : 10 }}>
                    {display.unread && <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: 5, height: 5, background: 'var(--primary)', borderRadius: '50%' }} />}
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: display.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'oklch(98% 0.005 175)', flexShrink: 0 }}>
                      {display.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', lineHeight: 1.4, color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: display.text }} />
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{display.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Messages */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} style={{ color: 'var(--accent)' }} /> Messages
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conversations.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>No messages yet.</p>
              ) : (conversations as any[]).slice(0, 3).map((c: any, i: number) => (
                <div key={i} onClick={() => window.location.href = '/inbox'} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 9, cursor: 'pointer', background: c.unread > 0 ? 'var(--bg-inset)' : 'transparent', transition: 'background 0.2s' }}>
                  {c.other_user?.profile_image ? (
                    <img src={c.other_user.profile_image} alt={c.other_user.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>{c.other_user?.name?.charAt(0) || '?'}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.other_user?.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_message}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/inbox" style={{ display: 'block', textAlign: 'center', padding: '10px 0', fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', marginTop: 8 }}>View Inbox</Link>
          </div>

          {/* Following */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: 'var(--accent)' }} /> Following
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {following.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>Not following anyone yet.</p>}
              {following.map((f: any, i) => {
                const display = getFollowingDisplay(f)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: display.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'oklch(98% 0.005 175)', flexShrink: 0 }}>{display.initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{display.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{display.role}</div>
                    </div>
                    <button style={{ padding: '5px 12px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>Following</button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reading Activity */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} /> Reading This Week
            </h3>
            <ReadingChart data={readingData} />
          </div>

          {/* Interests */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={16} style={{ color: 'var(--accent)' }} /> Your Interests
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {interests.map((interest, i) => (
                <span key={i} style={{ padding: '5px 12px', background: 'var(--bg-inset)', borderRadius: 16, fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' }}>{interest}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ReadingChart({ data }: { data: number[] }) {
  const max = Math.max(...data)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, padding: '8px 0' }}>
        {data.map((val, i) => (
          <div key={i} style={{ flex: 1, borderRadius: 3, background: val > 0 ? 'var(--primary-light)' : 'var(--bg-inset)', height: val > 0 ? `${Math.max(8, (val / max) * 100)}%` : '8px', opacity: val > 0 ? 1 : 0.3, minHeight: 4, transition: 'background 0.15s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
      </div>
    </div>
  )
}

function TrendingUp(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function Users(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
