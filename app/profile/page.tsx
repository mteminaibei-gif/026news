// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Heart, Bookmark, MessageSquare, Bell, Settings, Send, ThumbsUp, Reply, Star, BarChart3, TrendingUp, Users, LayoutDashboard, PenTool, FileText, Eye, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState('dashboard')

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
  // Journalist dashboard data
  const [myArticles, setMyArticles] = useState<any[]>([])
  const [myEarnings, setMyEarnings] = useState<any[]>([])
  const [totalJournalists, setTotalJournalists] = useState(0)
  const [myRank, setMyRank] = useState(1)
  const [stats, setStats] = useState({ articles: 0, saved: 0, following: 0, comments: 0 })
  // Journalist application state
  const [applyStep, setApplyStep] = useState(1)
  const [applyFirstName, setApplyFirstName] = useState('')
  const [applyLastName, setApplyLastName] = useState('')
  const [applyTitle, setApplyTitle] = useState('')
  const [applyNiche, setApplyNiche] = useState('')
  const [applyBio, setApplyBio] = useState('')
  const [applyExperience, setApplyExperience] = useState('')
  const [applyPortfolio, setApplyPortfolio] = useState('')
  const [applyLinkedin, setApplyLinkedin] = useState('')
  const [applyMotivation, setApplyMotivation] = useState('')
  const [applyTerms, setApplyTerms] = useState(false)
  const [applySubmitting, setApplySubmitting] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState(false)
  const APPLY_NICHES = ['World Updates', 'Kenya Focus', 'Politics & Governance', 'Business & Economy', 'Tech & Innovation', 'Health & Wellness', 'Arts & Culture', 'Sports Arena']
  const APPLY_EXP = ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years']

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (userId === null || !user) return
    loadSaved()
    loadLiked()
    loadComments()
    loadNotifs()
    loadFollowing()
    loadConversations()
    loadStats()
    loadInterests()
    loadReadingActivity()
    loadDashboard()
  }, [userId, user])

  const loadDashboard = async () => {
    if (!userId) return
    try {
      const role = (user as any)?.role
      if (role === 'journalist' || role === 'admin') {
        const [{ data: arts }, { data: earns }, { count: totJ }, { count: abvJ }] = await Promise.all([
          supabase.from('articles').select('article_id, title, slug, status, featured_image, views, earnings, created_at').eq('author_id', userId).order('created_at', { ascending: false }).limit(10),
          supabase.from('earnings').select('amount, payout_status, created_at, source').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
          supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never),
          supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never).gt('rank_score', (user as any)?.rank_score ?? 0),
        ])
        setMyArticles((arts as any[]) || [])
        setMyEarnings((earns as any[]) || [])
        setTotalJournalists(totJ ?? 0)
        setMyRank((abvJ ?? 0) + 1)
      }
    } catch {}
  }

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
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
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
        </div>

        {/* Tabs */}
        <div className="profile-tabs" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
            { id: 'saved', label: 'Saved', icon: Bookmark, count: stats.saved },
            { id: 'liked', label: 'Liked', icon: Heart, count: likedArticles.length },
            { id: 'comments', label: 'Comments', icon: MessageSquare, count: stats.comments },
            { id: 'history', label: 'History', icon: null, count: null },
            // Only show apply tab to readers who haven't applied yet
            ...(user && user.role === 'reader' && !(user as any).author_application ? [{ id: 'become-journalist', label: '✍️ Write for Us', icon: null, count: null }] : []),
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <main className="lg:col-span-2 space-y-6">
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

          {/* Dashboard Tab — role-based, renders in the same page */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {user && user.role === 'reader' && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashCard label="Articles Read" value={stats.articles} icon={<Eye size={18} />} color="var(--primary)" />
                    <DashCard label="Saved" value={stats.saved} icon={<Bookmark size={18} />} color="var(--accent)" />
                    <DashCard label="Following" value={stats.following} icon={<Users size={18} />} color="var(--success)" />
                    <DashCard label="Comments" value={stats.comments} icon={<MessageSquare size={18} />} color="var(--warning)" />
                  </div>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TrendingUp size={16} style={{ color: 'var(--accent)' }} /> Reading This Week
                    </h3>
                    <ReadingChart data={readingData} />
                  </div>
                  {!(user as any).author_application && (
                    <button onClick={() => setActiveTab('become-journalist')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                      ✍️ Want to write for us? Become a journalist
                    </button>
                  )}
                </>
              )}

              {user && user.role === 'journalist' && (
                <JournalistDashboard
                  myArticles={myArticles}
                  myEarnings={myEarnings}
                  myRank={myRank}
                  totalJournalists={totalJournalists}
                />
              )}

              {user && user.role === 'admin' && (
                <>
                  {/* Admin: full management quick-access, coherent with the
                      dedicated /admin dashboard, surfaced directly in profile. */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashCard label="Total Users" value={totalJournalists} icon={<Users size={18} />} color="var(--primary)" />
                    <DashCard label="Articles" value={myArticles.length} icon={<FileText size={18} />} color="var(--accent)" />
                    <DashCard label="In Review" value={myArticles.filter(a => a.status === 'under_review').length} icon={<Clock size={18} />} color="var(--warning)" />
                    <DashCard label="Published" value={myArticles.filter(a => a.status === 'published').length} icon={<CheckCircle size={18} />} color="var(--success)" />
                  </div>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LayoutDashboard size={16} style={{ color: 'var(--accent)' }} /> Administration
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <AdminQuickLink href="/admin/articles" label="Articles" icon={<FileText size={15} />} />
                      <AdminQuickLink href="/admin/reviews" label="Reviews" icon={<BarChart3 size={15} />} />
                      <AdminQuickLink href="/admin/journalists" label="Authors" icon={<Users size={15} />} />
                      <AdminQuickLink href="/admin/users" label="Users" icon={<Users size={15} />} />
                      <AdminQuickLink href="/admin/analytics" label="Analytics" icon={<TrendingUp size={15} />} />
                      <AdminQuickLink href="/admin/earnings" label="Earnings" icon={<DollarSign size={15} />} />
                      <AdminQuickLink href="/admin/categories" label="Categories" icon={<FileText size={15} />} />
                      <AdminQuickLink href="/admin/sources" label="Sources" icon={<FileText size={15} />} />
                      <AdminQuickLink href="/admin/settings" label="Settings" icon={<Settings size={15} />} />
                    </div>
                  </div>
                  {/* Admins who also write keep their author dashboard */}
                  <JournalistDashboard
                    myArticles={myArticles}
                    myEarnings={myEarnings}
                    myRank={myRank}
                    totalJournalists={totalJournalists}
                  />
                </>
              )}
            </div>
          )}

          {/* Journalist Application Tab — only for readers without an existing application */}
          {activeTab === 'become-journalist' && user && user.role === 'reader' && !(user as any).author_application && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24 }}>
              {applySuccess ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.75rem' }}>✓</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Application Submitted!</h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', maxWidth: 360, margin: '0 auto' }}>Our editorial team will review your application and get back to you within 48 hours.</p>
                </div>
              ) : (
                <>
                  {/* Progress steps */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 0 }}>
                    {[{n:1,l:'About You'},{n:2,l:'Portfolio'},{n:3,l:'Submit'}].map((s, i) => (
                      <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, background: applyStep >= s.n ? 'var(--primary)' : 'var(--bg-inset)', color: applyStep >= s.n ? '#fff' : 'var(--text-muted)', border: applyStep >= s.n ? 'none' : '1px solid var(--border)', transition: 'all 0.3s' }}>{applyStep > s.n ? '✓' : s.n}</div>
                          <span style={{ fontSize: '0.65rem', marginTop: 3, color: applyStep >= s.n ? 'var(--primary)' : 'var(--text-muted)', fontWeight: applyStep >= s.n ? 600 : 400 }}>{s.l}</span>
                        </div>
                        {i < 2 && <div style={{ width: 48, height: 2, margin: '0 6px', marginBottom: 14, background: applyStep > s.n ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />}
                      </div>
                    ))}
                  </div>
                  {applyError && <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: '0.82rem', background: 'var(--error-light)', color: 'var(--error)', marginBottom: 16 }}>{applyError}</div>}
                  {/* Step 1: About You */}
                  {applyStep === 1 && (
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>About You</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>Tell us about yourself and your writing background.</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <label style={{ display: 'block' }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5 }}>First Name</span><input value={applyFirstName} onChange={e => setApplyFirstName(e.target.value)} placeholder="John" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} /></label>
                        <label style={{ display: 'block' }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5 }}>Last Name</span><input value={applyLastName} onChange={e => setApplyLastName(e.target.value)} placeholder="Doe" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} /></label>
                      </div>
                      <label style={{ display: 'block', marginBottom: 12 }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5 }}>Professional Title</span><input value={applyTitle} onChange={e => setApplyTitle(e.target.value)} placeholder="e.g. Tech Reporter" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} /></label>
                      <label style={{ display: 'block', marginBottom: 12 }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5 }}>Writing Niche</span><select value={applyNiche} onChange={e => setApplyNiche(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}><option value="">Select a niche</option>{APPLY_NICHES.map(n => <option key={n} value={n}>{n}</option>)}</select></label>
                      <label style={{ display: 'block', marginBottom: 12 }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5 }}>Bio</span><textarea value={applyBio} onChange={e => setApplyBio(e.target.value)} placeholder="Share your writing experience..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', minHeight: 80, resize: 'vertical' }} /></label>
                      <label style={{ display: 'block', marginBottom: 20 }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5 }}>Experience</span><select value={applyExperience} onChange={e => setApplyExperience(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}><option value="">Select experience level</option>{APPLY_EXP.map(l => <option key={l} value={l}>{l}</option>)}</select></label>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => setApplyStep(2)} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Continue →</button></div>
                    </div>
                  )}
                  {/* Step 2: Portfolio */}
                  {applyStep === 2 && (
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Your Portfolio</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>Share links to your work.</p>
                      <label style={{ display: 'block', marginBottom: 12 }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5 }}>Portfolio URL</span><input value={applyPortfolio} onChange={e => setApplyPortfolio(e.target.value)} placeholder="https://yourportfolio.com" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} /></label>
                      <label style={{ display: 'block', marginBottom: 20 }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5 }}>LinkedIn Profile</span><input value={applyLinkedin} onChange={e => setApplyLinkedin(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} /></label>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button onClick={() => setApplyStep(1)} style={{ padding: '9px 22px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>← Back</button>
                        <button onClick={() => setApplyStep(3)} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Continue →</button>
                      </div>
                    </div>
                  )}
                  {/* Step 3: Review & Submit */}
                  {applyStep === 3 && (
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Review & Submit</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>You're almost there! Tell us why you want to write for us.</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                        {[{ icon: '💰', title: '70% Revenue Share', desc: 'Keep the majority of your earnings' }, { icon: '📊', title: 'Analytics Dashboard', desc: 'Track your article performance' }, { icon: '💳', title: 'M-Pesa Withdrawals', desc: 'Get paid directly to your M-Pesa' }, { icon: '✍️', title: 'Rich Editor', desc: 'Powerful writing & editing tools' }].map(p => (
                          <div key={p.title} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--primary-muted)', border: '1px solid var(--border-subtle)' }}><span style={{ fontSize: '1.1rem' }}>{p.icon}</span><p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0 2px' }}>{p.title}</p><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{p.desc}</p></div>
                        ))}
                      </div>
                      <label style={{ display: 'block', marginBottom: 12 }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5 }}>Why do you want to write for 026connet!?</span><textarea value={applyMotivation} onChange={e => setApplyMotivation(e.target.value)} placeholder="Share your motivation..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', minHeight: 80, resize: 'vertical' }} /></label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                        <input type="checkbox" checked={applyTerms} onChange={e => setApplyTerms(e.target.checked)} style={{ accentColor: 'var(--primary)', width: 15, height: 15 }} />
                        I agree to the terms and conditions
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button onClick={() => setApplyStep(2)} style={{ padding: '9px 22px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>← Back</button>
                        <button disabled={applySubmitting || !applyTerms} onClick={async () => {
                          setApplySubmitting(true); setApplyError('')
                          try {
                            const res = await fetch('/api/auth/apply-journalist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organization: [applyFirstName, applyLastName].filter(Boolean).join(' ') || undefined, portfolio: applyPortfolio || undefined, title: applyTitle || undefined, niche: applyNiche || undefined, bio: applyBio || undefined, experience: applyExperience || undefined, linkedin: applyLinkedin || undefined, motivation: applyMotivation || undefined }) })
                            const data = await res.json()
                            if (!res.ok) { setApplyError(data.error || 'Could not submit your application.'); setApplySubmitting(false); return }
                            setApplySuccess(true)
                          } catch { setApplyError('Network error. Please try again.') } finally { setApplySubmitting(false) }
                        }} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: applyTerms ? 'pointer' : 'not-allowed', opacity: applyTerms ? 1 : 0.6 }}>
                          {applySubmitting ? 'Submitting…' : 'Submit Application'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
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
        <aside className="lg:col-span-1 space-y-6">
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

function DashCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-inset)', color }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
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

function JournalistDashboard({ myArticles, myEarnings, myRank, totalJournalists }: {
  myArticles: any[]
  myEarnings: any[]
  myRank: number
  totalJournalists: number
}) {
  const published = myArticles.filter(a => a.status === 'published').length
  const inReview = myArticles.filter(a => a.status === 'under_review').length
  const totalViews = myArticles.reduce((s: number, a: any) => s + (a.views ?? 0), 0)
  const totalEarn = myEarnings.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthEarn = myEarnings.filter((e: any) => (e.created_at || '').startsWith(thisMonth)).reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashCard label="Published" value={published} icon={<CheckCircle size={18} />} color="var(--success)" />
        <DashCard label="In Review" value={inReview} icon={<Clock size={18} />} color="var(--warning)" />
        <DashCard label="Total Views" value={totalViews.toLocaleString()} icon={<Eye size={18} />} color="var(--primary)" />
        <DashCard label="Earnings" value={`Ksh ${totalEarn.toLocaleString()}`} icon={<DollarSign size={18} />} color="var(--accent)" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PenTool size={16} style={{ color: 'var(--accent)' }} /> Recent Articles
          </h3>
          {myArticles.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>No articles yet.</p>
          ) : (
            <div className="space-y-2">
              {myArticles.slice(0, 5).map((a: any) => (
                <Link key={a.article_id} href={`/article/${a.slug || a.article_id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'var(--bg-inset)', textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginLeft: 8, flexShrink: 0 }}>{a.status}</span>
                </Link>
              ))}
              <Link href="/journalist/articles" style={{ display: 'block', textAlign: 'center', padding: '8px 0', fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>View all articles</Link>
            </div>
          )}
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={16} style={{ color: 'var(--accent)' }} /> Earnings
          </h3>
          <div className="space-y-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}><span style={{ color: 'var(--text-tertiary)' }}>This month</span><strong>Ksh {monthEarn.toLocaleString()}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}><span style={{ color: 'var(--text-tertiary)' }}>All time</span><strong>Ksh {totalEarn.toLocaleString()}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}><span style={{ color: 'var(--text-tertiary)' }}>Author rank</span><strong>#{myRank} of {totalJournalists}</strong></div>
          </div>
          <Link href="/journalist/earnings" style={{ display: 'block', textAlign: 'center', padding: '8px 0', fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', marginTop: 8 }}>View earnings</Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/journalist/create" style={{ padding: '10px 18px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>+ New Article</Link>
        <Link href="/journalist/analytics" style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>Analytics</Link>
      </div>
    </>
  )
}

function AdminQuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-inset)', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, transition: 'background 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-inset)' }}>
      <span style={{ color: 'var(--primary)' }}>{icon}</span>
      {label}
    </Link>
  )
}


