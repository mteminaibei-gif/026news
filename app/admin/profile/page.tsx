'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadProfileImage } from '@/lib/storage'
import { Heart, Bookmark, MessageSquare, Bell, Settings, Loader2, Users, BarChart3, DollarSign, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, Users as UsersIcon, DollarSign as DollarSignIcon, Award, FileText, Settings as SettingsIcon, Plus, Eye, Edit, Trash2, Flag, Star, Share2, MoreHorizontal, Camera, UserCheck, UserX } from 'lucide-react'
import { formatNumber, formatCurrency, stripHtml, timeAgo } from '@/lib/utils'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { BarChart } from '@/components/ui/BarChart'
import { BadgePill } from '@/components/ui/BadgePill'
import { AdminArticleActions } from '@/components/admin/AdminArticleActions'
import { AdminJournalistActions } from '@/components/admin/AdminJournalistActions'
import { LiveRegistrationsFeed } from '@/components/admin/LiveRegistrationsFeed'
import { RealtimeFeedFetcher } from '@/components/admin/RealtimeFeedFetcher'
import { RealtimeNotifications } from '@/components/admin/RealtimeNotifications'
import { AdminControlPanel } from '@/components/admin/AdminControlPanel'
import { ArticleManager } from '@/components/admin/ArticleManager'
import { AccountCreationDialog } from '@/components/admin/AccountCreationDialog'

interface Profile {
  user_id: number; name: string; role: string; bio: string | null
  profile_image: string | null; created_at: string
}
interface Article {
  article_id: number; title: string; slug: string; content: string
  featured_image: string | null; views: number; likes: number; post_type: string
  created_at: string; category?: { name: string } | null; status: string
  author?: { name: string } | null
  source_name: string | null
  earnings: number
  is_aggregated: boolean
}
interface Notification {
  notification_id: number; type: string; title: string; message: string
  is_read: boolean; created_at: string
}
interface Conversation {
  other_user: { user_id: number; name: string; profile_image: string | null }
  last_message: string; last_message_at: string; unread: number
}
type JournalistRow = {
  user_id: number; name: string; email: string
  profile_image: string | null; status: string
}

const ARTICLE_SELECT = 'article_id, title, slug, status, featured_image, views, earnings, created_at, author:users(name), category:categories(name), source_name, is_aggregated'

export default function AdminProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'control-panel' | 'about' | 'profile'>('dashboard')
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null)
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false)

  // Profile editing state
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Journalist applications state
  const [pendingApplications, setPendingApplications] = useState<any[]>([])
  const [processingApplication, setProcessingApplication] = useState<number | null>(null)

  // Dashboard state
  const [inhouseArticles, setInhouseArticles] = useState<Article[]>([])
  const [sourcedArticles, setSourcedArticles] = useState<Article[]>([])
  const [journalists, setJournalists] = useState<JournalistRow[]>([])
  const [totalArticlesCount, setTotalArticlesCount] = useState(0)
  const [publishLimits, setPublishLimits] = useState<{ inhouse: number; sourced: number }>({ inhouse: 0, sourced: 0 })
  const [savingLimits, setSavingLimits] = useState(false)
  const [journalistsCount, setJournalistsCount] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [pendingPayout, setPendingPayout] = useState(0)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [admin, setAdmin] = useState<{ name: string; profile_image: string | null }>({ name: 'Admin', profile_image: null })

  // Profile tab state
  const [articles, setArticles] = useState<Article[]>([])
  const [savedArticles, setSaved] = useState<any[]>([])
  const [likedArticles, setLiked] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [notifications, setNotifs] = useState<Notification[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    resolveAndLoad()
  }, [])

  useEffect(() => {
    if (currentUserId === null) return
    loadProfileData()
  }, [currentUserId])

  async function resolveAndLoad() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.id) { router.push('/login?redirect=/admin/profile'); setLoading(false); return }

    const { data } = await supabase.from('users').select('user_id, name, role, bio, profile_image, created_at').eq('auth_id', authUser.id).single()
    if (data) {
      setProfile(data as Profile)
      setCurrentUserId((data as { user_id: number }).user_id)
    }
    setLoading(false)
  }

  // Initialize edit fields when profile loads
  useEffect(() => {
    if (profile) {
      setEditName(profile.name)
      setEditBio(profile.bio ?? '')
    }
  }, [profile])

  async function handleSaveProfile() {
    if (!editName.trim()) return
    setSavingProfile(true)
    setProfileSaved(false)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), bio: editBio.trim() }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setProfile(p => p ? { ...p, name: editName.trim(), bio: editBio.trim() || null } : p)
      setAdmin(a => ({ ...a, name: editName.trim() }))
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch {
      setNotification({ type: 'info', message: 'Failed to save profile' })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentUserId) return
    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'info', message: 'Image must be under 5MB' })
      return
    }
    setUploadingAvatar(true)
    try {
      const { url } = await uploadProfileImage(file, currentUserId)
      const res = await fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image: url }),
      })
      if (!res.ok) throw new Error('Failed to update avatar')
      setProfile(p => p ? { ...p, profile_image: url } : p)
      setAdmin(a => ({ ...a, profile_image: url }))
      setNotification({ type: 'success', message: 'Avatar updated' })
    } catch {
      setNotification({ type: 'info', message: 'Avatar upload failed' })
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  async function loadPendingApplications() {
    try {
      const res = await fetch('/api/admin/journalists?status=pending')
      const data = await res.json()
      setPendingApplications(data.applications ?? [])
    } catch { /* ignore */ }
  }

  async function handleApplicationAction(userId: number, action: 'approve' | 'decline') {
    setProcessingApplication(userId)
    try {
      const res = await fetch('/api/admin/journalists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action }),
      })
      if (!res.ok) throw new Error('Failed')
      setPendingApplications(prev => prev.filter(a => a.user_id !== userId))
      setNotification({ type: 'success', message: action === 'approve' ? 'Journalist approved' : 'Application declined' })
    } catch {
      setNotification({ type: 'info', message: 'Action failed' })
    } finally {
      setProcessingApplication(null)
    }
  }

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: adminData } = await supabase
          .from('users').select('name, profile_image').eq('email', user.email ?? '').single() as { data: { name: string; profile_image: string | null } | null }
        if (adminData) {
          setAdmin({ name: adminData.name, profile_image: adminData.profile_image })
        } else {
          setAdmin({ name: user.email?.split('@')[0] || 'Admin', profile_image: null })
        }
      }

      const [inhouseRes, sourcedRes, settingsRes] = await Promise.all([
        supabase
          .from('articles')
          .select(ARTICLE_SELECT, { count: 'exact' })
          .eq('is_aggregated', false)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('articles')
          .select(ARTICLE_SELECT, { count: 'exact' })
          .eq('is_aggregated', true)
          .order('created_at', { ascending: false })
          .limit(20),
        (supabase.from('site_settings') as any)
          .select('key, value')
          .eq('key', 'publish_limits')
          .maybeSingle(),
      ])
      setInhouseArticles((inhouseRes.data ?? []) as Article[])
      setSourcedArticles((sourcedRes.data ?? []) as Article[])
      setTotalArticlesCount((inhouseRes.count ?? 0) + (sourcedRes.count ?? 0))
      if (settingsRes.data?.value) {
        const v = settingsRes.data.value as { inhouse?: number; sourced?: number }
        setPublishLimits({
          inhouse: Number(v.inhouse ?? 0),
          sourced: Number(v.sourced ?? 0),
        })
      }

      const { data: rawJournalists, count: jCount } = await supabase
        .from('users')
        .select('user_id, name, email, profile_image, status', { count: 'exact' })
        .eq('role', 'journalist' as never)
        .order('created_at', { ascending: false })
        .limit(10) as any
      setJournalists((rawJournalists ?? []) as JournalistRow[])
      setJournalistsCount(jCount ?? 0)

      const { count: uCount } = await supabase.from('users').select('user_id', { count: 'exact', head: true })
      setTotalUsers(uCount ?? 0)

      const { data: rawRevenue } = await supabase.from('earnings').select('amount, payout_status') as any
      const revenueRows = rawRevenue ?? []
      const totalRev = revenueRows.reduce((s: number, r: any) => s + Number(r.amount), 0)
      const pendingPay = revenueRows.filter((r: any) => r.payout_status === 'pending').reduce((s: number, r: any) => s + Number(r.amount), 0)
      setTotalRevenue(totalRev)
      setPendingPayout(pendingPay)

      const { data: rawRecent } = await supabase.from('users').select('user_id, name, email, role, status, created_at').order('created_at', { ascending: false }).limit(10) as any
      setRecentUsers(rawRecent ?? [])

      loadPendingApplications()

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()
    const articlesChannel = supabase.channel('admin-articles').on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setNotification({ type: 'success', message: `New article: ${payload.new.title?.substring(0, 40)}...` })
        setTimeout(() => setNotification(null), 5000)
      }
      fetchDashboardData()
    }).subscribe()

    const usersChannel = supabase.channel('admin-users').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload: any) => {
      setNotification({ type: 'info', message: `New user: ${payload.new.name || payload.new.email}` })
      setTimeout(() => setNotification(null), 5000)
      fetchDashboardData()
    }).subscribe()

    return () => {
      supabase.removeChannel(articlesChannel)
      supabase.removeChannel(usersChannel)
    }
  }, [fetchDashboardData, supabase])

  const loadProfileData = async () => {
    if (!currentUserId) return
    const { data } = await supabase
      .from('articles')
      .select('*, category:categories(name)')
      .eq('author_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(20)
    setArticles((data as Article[]) || [])

    const { data: saved } = await supabase
      .from('saved_articles')
      .select('article_id, saved_at, articles!inner(article_id, title, slug, featured_image, reading_time_minutes, created_at, author:users(name), category:categories(name))')
      .eq('user_id', currentUserId)
      .order('saved_at', { ascending: false })
      .limit(10)
    setSaved((saved as any[]) || [])

    const { data: liked } = await supabase
      .from('article_likes')
      .select('created_at, articles!inner(article_id, title, slug, featured_image, reading_time_minutes, created_at, author:users(name), category:categories(name))')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(10)
    setLiked((liked as any[]) || [])

    const { data: commentsData } = await supabase
      .from('comments')
      .select('*, articles!inner(article_id, title, slug, featured_image)')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(10)
    setComments((commentsData as any[]) || [])

    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(10)
    setNotifs((notifs as Notification[]) || [])

    const { data: followingData } = await supabase
      .from('user_follows')
      .select('*, following:users!user_follows_following_id_fkey(user_id, name, profile_image, role)')
      .eq('follower_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(10)
    setFollowing((followingData as any[]) || [])

    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!msgs?.length) { setConversations([]); return }

      const convMap = new Map<number, Conversation>()
      for (const msg of msgs as { sender_id: number; receiver_id: number; content: string; created_at: string; is_read: boolean }[]) {
        const otherId: number = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
        if (otherId === currentUserId) continue
        if (!convMap.has(otherId)) {
          const { data: u } = await supabase.from('users').select('user_id, name, profile_image').eq('user_id', otherId).single()
          const fallback = { user_id: otherId, name: 'Unknown', profile_image: null }
          convMap.set(otherId, {
            other_user: u ? (u as { user_id: number; name: string; profile_image: string | null }) : fallback,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread: 0,
          })
        }
      }
      setConversations(Array.from(convMap.values()).slice(0, 5))
    } catch { setConversations([]) }
  }

  const pending = [...inhouseArticles, ...sourcedArticles].filter(a => a.status === 'under_review')
  const published = [...inhouseArticles, ...sourcedArticles].filter(a => a.status === 'published')

  const saveLimits = async () => {
    setSavingLimits(true)
    const { error } = await (supabase.from('site_settings') as any)
      .upsert({ key: 'publish_limits', value: publishLimits, updated_at: new Date().toISOString() })
    if (error) {
      console.error('Failed to save publish limits:', error)
      setNotification({ type: 'info', message: 'Could not save publish limits.' })
    } else {
      setNotification({ type: 'success', message: 'Publish limits updated.' })
      setTimeout(() => setNotification(null), 4000)
    }
    setSavingLimits(false)
  }

  async function toggleSave(articleId: number) {
    if (!currentUserId) return
    const exists = savedArticles.some(s => s.article_id === articleId)
    if (exists) {
      await supabase.from('saved_articles').delete().eq('user_id', currentUserId).eq('article_id', articleId)
      setSaved(prev => prev.filter(s => s.article_id !== articleId))
    } else {
      await supabase.from('saved_articles').insert({ user_id: currentUserId, article_id: articleId } as never)
      setSaved(prev => [...prev, { article_id: articleId, saved_at: new Date().toISOString() }])
    }
  }

  async function toggleLike(articleId: number) {
    if (!currentUserId) return
    const exists = likedArticles.some(l => l.articles?.article_id === articleId)
    if (exists) {
      await supabase.from('article_likes').delete().eq('user_id', currentUserId).eq('article_id', articleId)
      setLiked(prev => prev.filter(l => l.articles?.article_id !== articleId))
      setArticles(prev => prev.map(a => a.article_id === articleId ? { ...a, likes: Math.max((a.likes || 1) - 1, 0) } : a))
    } else {
      await supabase.from('article_likes').insert({ user_id: currentUserId, article_id: articleId } as never)
      setLiked(prev => [...prev, { articles: articles.find(a => a.article_id === articleId), liked_at: new Date().toISOString() }])
      setArticles(prev => prev.map(a => a.article_id === articleId ? { ...a, likes: (a.likes || 0) + 1 } : a))
    }
  }

  async function markNotifRead(id: number) {
    await supabase.from('notifications').update({ is_read: true } as never).eq('notification_id', id)
    setNotifs(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n))
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>Please log in</p>
        <button onClick={() => router.push('/login?redirect=/admin/profile')} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>Go to Login</button>
      </div>
    )
  }

  const unreadNotifs = notifications.filter(n => !n.is_read)
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const chartData: number[] = []
  const chartLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    chartLabels.push(d.toLocaleString('default', { month: 'short' }))
    chartData.push(articles.filter(a => a.created_at.startsWith(ym)).length)
  }

  const allArticles = [...inhouseArticles, ...sourcedArticles]
  const trafficChartData: number[] = []
  const trafficChartLabels: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    trafficChartLabels.push(d.toLocaleString('default', { month: 'short' }))
    trafficChartData.push(allArticles.filter(a => a.created_at.startsWith(ym)).reduce((sum, a) => sum + (a.views || 0), 0))
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {notification && (
        <div className="fixed top-24 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in" style={{
          borderRadius: 16,
          ...(notification.type === 'success'
            ? { background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)' }
            : { background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)' })
        }}>
          {notification.message}
        </div>
      )}

      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="admin-header" style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 40px' }}>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <div
            onClick={() => avatarInputRef.current?.click()}
            style={{ width: 120, height: 120, borderRadius: 28, overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'var(--bg-inset)', cursor: 'pointer' }}
            title="Change avatar"
          >
            {profile.profile_image ? (
              <Image src={profile.profile_image} alt={profile.name} fill style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, oklch(50% 0.14 220), oklch(42% 0.12 200))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 700, color: 'oklch(98% 0.005 175)' }}>
                {profile.name.charAt(0)}
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="admin-header-title">
              <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: "'Newsreader', Georgia, serif" }}>{profile.name}</h1>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 6 }}>Admin</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', marginBottom: 10 }}>@{profile.name.toLowerCase().replace(/\s+/g, '')} · Joined {joinDate}</p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '55ch', lineHeight: 1.6, marginBottom: 16 }}>{profile.bio ?? 'No bio available.'}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setActiveTab('dashboard')}
          className="profile-tab-btn"
          style={{ fontWeight: 500, color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-tertiary)', borderBottomColor: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent' }}>
          Dashboard
        </button>
        <button onClick={() => setActiveTab('articles')}
          className="profile-tab-btn"
          style={{ fontWeight: 500, color: activeTab === 'articles' ? 'var(--primary)' : 'var(--text-tertiary)', borderBottomColor: activeTab === 'articles' ? 'var(--primary)' : 'transparent' }}>
          Articles ({articles.length})
        </button>
        <button onClick={() => setActiveTab('control-panel')}
          className="profile-tab-btn"
          style={{ fontWeight: 500, color: activeTab === 'control-panel' ? 'var(--primary)' : 'var(--text-tertiary)', borderBottomColor: activeTab === 'control-panel' ? 'var(--primary)' : 'transparent' }}>
          Control Panel
        </button>
        <button onClick={() => setActiveTab('about')}
          className="profile-tab-btn"
          style={{ fontWeight: 500, color: activeTab === 'about' ? 'var(--primary)' : 'var(--text-tertiary)', borderBottomColor: activeTab === 'about' ? 'var(--primary)' : 'transparent' }}>
          About
        </button>
        <button onClick={() => setActiveTab('profile')}
          className="profile-tab-btn"
          style={{ fontWeight: 500, color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-tertiary)', borderBottomColor: activeTab === 'profile' ? 'var(--primary)' : 'transparent' }}>
          Profile
        </button>
      </div>

{/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Main Content */}
        <main>
          {activeTab === 'dashboard' && (
            <div className="p-6 space-y-6">
              <RealtimeFeedFetcher initialArticlesCount={totalArticlesCount} />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.3s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 20 }}>📰</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Articles</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{totalArticlesCount.toLocaleString()}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 2 }}>{published.length} published</p>
                  </div>
                </div>
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.3s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warning-light)', color: 'var(--warning)', fontSize: 20 }}>⏳</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{pending.length}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 2 }}>Awaiting approval</p>
                  </div>
                </div>
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.3s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--info)', color: 'var(--text-inverse)', fontSize: 20 }}>👥</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{formatNumber(totalUsers)}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 2 }}>{journalistsCount} authors</p>
                  </div>
                </div>
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.3s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--success-light)', color: 'var(--success)', fontSize: 20 }}>💵</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{formatCurrency(totalRevenue)}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 2 }}>{formatCurrency(pendingPayout)} pending</p>
                  </div>
                </div>
              </div>

              {/* Real-time Notifications */}
              <div className="flex items-center justify-between animate-fade-in-up">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>🔔 Notifications</h3>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--primary)' }} />
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Live</span>
                </div>
                <RealtimeNotifications />
              </div>

              {/* Pending Journalist Applications */}
              {pendingApplications.length > 0 && (
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }} className="animate-fade-in-up">
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>📝</div>
                      <div>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Pending Journalist Applications</h3>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{pendingApplications.length} awaiting review</p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {pendingApplications.map((app) => (
                      <div key={app.user_id} className="px-6 py-4 flex items-center gap-4">
                        {app.profile_image ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                            <Image src={app.profile_image} alt={app.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            {app.name?.charAt(0) ?? '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{app.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{app.email}</p>
                          {app.author_application?.niche && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Niche: {app.author_application.niche}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            disabled={processingApplication === app.user_id}
                            onClick={() => handleApplicationAction(app.user_id, 'approve')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' }}
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            disabled={processingApplication === app.user_id}
                            onClick={() => handleApplicationAction(app.user_id, 'decline')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'var(--error-light)', color: 'var(--error)', border: '1px solid var(--error)' }}
                          >
                            <UserX className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                {/* Traffic Chart */}
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>📈 Traffic Overview</h3>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Monthly article views</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'var(--success-light)', color: 'var(--success)' }}>Live</span>
                  </div>
                  <div className="p-6">
                    <BarChart data={trafficChartData} labels={trafficChartLabels} height={100} />
                  </div>
                </div>

                {/* Active Authors */}
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>⭐ Active Authors</h3>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Top performers this month</p>
                    </div>
                    <Link href="/admin/journalists" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>View All</Link>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {journalists.slice(0, 4).map(j => (
                      <div key={j.user_id} className="px-6 py-4 flex items-center gap-4 transition-colors" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        {j.profile_image ? (
                          <Image src={j.profile_image} alt={j.name} width={44} height={44} className="rounded-full object-cover" style={{ boxShadow: '0 0 0 2px var(--border-subtle)' }} />
                        ) : (
                          <div className="rounded-full flex items-center justify-center font-bold" style={{ width: 44, height: 44, background: 'var(--primary)', color: 'var(--text-inverse)' }}>{j.name.charAt(0)}</div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{j.name}</p>
                          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{j.email}</p>
                        </div>
                        <Badge status={j.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {/* Publish Limits + Article Library */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Publish Limits control */}
                  <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>⚙️ Publish Limits</h3>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Max published articles surfaced per source type (0 = unlimited)</p>
                      </div>
                      <button
                        onClick={saveLimits}
                        disabled={savingLimits}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                        style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}
                      >
                        {savingLimits ? 'Saving…' : 'Save Limits'}
                      </button>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>🏠 In-House (max published)</span>
                        <input
                          type="number" min={0} max={500}
                          value={publishLimits.inhouse}
                          onChange={(e) => setPublishLimits({ ...publishLimits, inhouse: Math.max(0, Number(e.target.value) || 0) })}
                          className="mt-2 w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>📡 Sourced / RSS (max published)</span>
                        <input
                          type="number" min={0} max={500}
                          value={publishLimits.sourced}
                          onChange={(e) => setPublishLimits({ ...publishLimits, sourced: Math.max(0, Number(e.target.value) || 0) })}
                          className="mt-2 w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Article Library */}
                  <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>📋 Content Library</h3>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>In-house vs sourced publications</p>
                    </div>
                    <ArticleTable title="In-House Publications" icon="🏠" rows={inhouseArticles} limit={publishLimits.inhouse} />
                    <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
                    <ArticleTable title="Sourced (RSS) Articles" icon="📡" rows={sourcedArticles} limit={publishLimits.sourced} />
                  </div>
                </div>

                {/* Side Panel */}
                <div className="space-y-5">
                  {/* Pending Reviews */}
                  {pending.length > 0 && (
                    <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                      <div className="px-5 py-4" style={{ background: 'var(--warning-light)', borderBottom: '1px solid var(--warning)' }}>
                        <h3 className="font-bold" style={{ color: 'var(--warning)' }}>⏳ Pending Review</h3>
                      </div>
                      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                        {pending.slice(0, 3).map(a => (
                          <div key={a.article_id} className="p-4 flex items-center gap-3">
                            {a.featured_image && (
                              <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0">
                                <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>By {a.author?.name}</p>
                            </div>
                            <Link href={`/admin/review/${a.article_id}`} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                              Review
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revenue Card */}
                  <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}>
                    <h3 className="font-bold text-lg mb-4">💰 Revenue Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ opacity: 0.8 }}>Total Revenue</span>
                        <span className="font-bold text-lg">{formatCurrency(totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ opacity: 0.8 }}>Pending Payout</span>
                        <span className="font-semibold" style={{ color: 'var(--warning)' }}>{formatCurrency(pendingPayout)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ opacity: 0.8 }}>Active Authors</span>
                        <span className="font-bold">{journalistsCount}</span>
                      </div>
                    </div>
                    <Link href="/admin/earnings" className="mt-5 block w-full py-3 text-center rounded-xl font-semibold text-sm transition-colors" style={{ background: 'rgba(255,255,255,0.2)' }}>
                      View Payment Report →
                    </Link>
                  </div>
                </div>
              </div>

              <LiveRegistrationsFeed initialUsers={recentUsers} />
            </div>
          )}

          {activeTab === 'control-panel' && <AdminControlPanel />}

          {activeTab === 'articles' && (
            <div className="p-6">
              <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>📋 Article Management</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Manage all articles — approve, categorize, tag, feature, expire, or delete</p>
                </div>
                <div className="p-6">
                  <ArticleManager />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 32 }}>
              <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>About {profile.name}</h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>{profile.bio ?? 'No bio available.'}</p>
              <div className="about-info-grid">
                <div style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Role</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'capitalize' }}>{profile.role}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Joined</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{joinDate}</div>
                </div>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 10, marginBottom: 16 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Articles Published</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{articles.filter(a => a.status === 'published').length}</div>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Total Views</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatNumber(articles.reduce((s, a) => s + (a.views ?? 0), 0))}</div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-6 max-w-2xl mx-auto">
              <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Edit Profile</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Update your name and bio</p>
                </div>
                <div className="p-6 space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      style={{ width: 72, height: 72, borderRadius: 20, overflow: 'hidden', position: 'relative', cursor: 'pointer', flexShrink: 0, background: 'var(--bg-inset)' }}
                      title="Change avatar"
                    >
                      {profile.profile_image ? (
                        <Image src={profile.profile_image} alt={profile.name} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, oklch(50% 0.14 220), oklch(42% 0.12 200))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'oklch(98% 0.005 175)' }}>
                          {profile.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                      >
                        {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                      </button>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>JPG, PNG. Max 5MB.</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                      style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Save button */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile || !editName.trim()}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                      style={{ background: 'var(--primary)', color: 'var(--bg-elevated)' }}
                    >
                      {savingProfile ? 'Saving...' : profileSaved ? 'Saved!' : 'Save Changes'}
                    </button>
                    {profileSaved && <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>Profile saved successfully.</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AccountCreationDialog isOpen={showCreateAccountDialog} onClose={() => setShowCreateAccountDialog(false)} />

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

function ArticleTable({ title, icon, rows, limit }: { title: string; icon: string; rows: Article[]; limit: number }) {
  const published = rows.filter((r) => r.status === 'published')
  const unlimited = !limit || limit <= 0
  const shown = unlimited ? published : published.slice(0, limit)
  const extra = Math.max(0, published.length - shown.length)
  return (
    <div>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{icon}</div>
          <div>
            <h4 className="font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{title}</h4>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {published.length} published · {unlimited ? 'showing all' : `showing ${shown.length}`}
              {!unlimited && extra > 0 ? <span style={{ color: 'var(--warning)' }}> ({extra} beyond limit)</span> : ''}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>{shown.length}</span>
      </div>

      {shown.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-4xl mb-3 opacity-40">🗞️</div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No published articles yet.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Published {title.toLowerCase()} will appear here.</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          <ul className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {shown.map((a) => {
            const name = a.author?.name ?? a.source_name ?? '—'
            const initials = name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '—'
            const isSourced = !a.author?.name && !!a.source_name
            return (
              <li
                key={a.article_id}
                className="group flex items-center gap-4 px-6 py-4 transition-all"
                style={{ borderLeft: '3px solid transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-muted)'
                  e.currentTarget.style.borderLeftColor = 'var(--primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderLeftColor = 'transparent'
                }}
              >
                {/* Thumbnail */}
                {a.featured_image ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ boxShadow: '0 0 0 1px var(--border-subtle)' }}>
                    <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>📰</div>
                )}

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {a.category?.name && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{a.category.name}</span>
                    )}
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(a.created_at)}</span>
                  </div>
                </div>

                {/* Author / source */}
                <div className="hidden md:flex items-center gap-2 w-44 shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: isSourced ? 'var(--info)' : 'var(--primary)', color: 'var(--text-inverse)' }}>{initials}</div>
                  <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{isSourced ? `📡 ${a.source_name}` : a.author?.name}</span>
                </div>

                {/* Views */}
                <div className="hidden lg:block shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>👁 {formatNumber(a.views)}</span>
                </div>

                {/* Status */}
                <div className="shrink-0"><Badge status={a.status} /></div>

                {/* Actions */}
                <div className="shrink-0"><AdminArticleActions articleId={a.article_id} currentStatus={a.status} /></div>
              </li>
            )
          })}
        </ul>
        </div>
      )}
    </div>
  )
}