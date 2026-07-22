'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadProfileImage } from '@/lib/storage'
import { Loader2, Camera, UserCheck, UserX, Plus, TrendingUp, Settings as SettingsIcon, Newspaper, Clock, Users, DollarSign } from 'lucide-react'
import { formatNumber, formatCurrency, timeAgo } from '@/lib/utils'
import { BarChart } from '@/components/ui/BarChart'
import { LiveRegistrationsFeed } from '@/components/admin/LiveRegistrationsFeed'
import { RealtimeFeedFetcher } from '@/components/admin/RealtimeFeedFetcher'
import { LiveAuthorFeed } from '@/components/admin/LiveAuthorFeed'
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
  read: boolean; created_at: string
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'settings'>('dashboard')
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
  const [totalArticlesCount, setTotalArticlesCount] = useState(0)
  const [publishLimits, setPublishLimits] = useState<{ inhouse: number; sourced: number }>({ inhouse: 0, sourced: 0 })
  const [savingLimits, setSavingLimits] = useState(false)
  const [journalistsCount, setJournalistsCount] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [pendingPayout, setPendingPayout] = useState(0)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [admin, setAdmin] = useState<{ name: string; profile_image: string | null }>({ name: 'Admin', profile_image: null })
  const [journalists, setJournalists] = useState<JournalistRow[]>([])

  useEffect(() => {
    resolveAndLoad()
  }, [])

  async function resolveAndLoad() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.id) { router.push('/login?redirect=/admin'); setLoading(false); return }

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
          .from('users').select('name, profile_image').eq('auth_id', user.id).single() as { data: { name: string; profile_image: string | null } | null }
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

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="page-spinner" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>Please log in</p>
        <button onClick={() => router.push('/login?redirect=/admin')} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>Go to Login</button>
      </div>
    )
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  const pending = [...inhouseArticles, ...sourcedArticles].filter(a => a.status === 'under_review')
  const published = [...inhouseArticles, ...sourcedArticles].filter(a => a.status === 'published')

  const saveLimits = async () => {
    setSavingLimits(true)
    const { error } = await (supabase.from('site_settings') as any)
      .upsert({ key: 'publish_limits', value: publishLimits, updated_at: new Date().toISOString() })
    if (error) {
      setNotification({ type: 'info', message: 'Could not save publish limits.' })
    } else {
      setNotification({ type: 'success', message: 'Publish limits updated.' })
      setTimeout(() => setNotification(null), 4000)
    }
    setSavingLimits(false)
  }

  const allArticles = [...inhouseArticles, ...sourcedArticles]
  const chartData: number[] = []
  const chartLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    chartLabels.push(d.toLocaleString('default', { month: 'short' }))
    chartData.push(allArticles.filter((a: Article) => a.created_at.startsWith(ym)).length)
  }

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
        <div className="animate-fade-up" style={{
          position: 'fixed', top: 24, right: 24, zIndex: 50,
          padding: '12px 20px', borderRadius: 16,
          boxShadow: 'var(--glow-soft)', fontSize: '0.85rem', fontWeight: 600,
          backdropFilter: notification.type === 'success' ? 'none' : 'blur(var(--glass-blur))',
          ...(notification.type === 'success'
            ? { background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)' }
            : { background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' })
        }}>
          {notification.message}
        </div>
      )}

      {/* Compact Header */}
      <div style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur)) saturate(140%)', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <div
            onClick={() => avatarInputRef.current?.click()}
            style={{ width: 48, height: 48, borderRadius: 14, overflow: 'hidden', position: 'relative', flexShrink: 0, cursor: 'pointer', boxShadow: 'var(--glow-primary)' }}
            title="Change avatar"
          >
            {profile.profile_image ? (
              <Image src={profile.profile_image} alt={profile.name} fill style={{ objectFit: 'cover' }}  sizes="(max-width: 640px) 100vw, 50vw" loading="lazy"/>
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                {profile.name.charAt(0)}
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              {uploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{profile.name}</h1>
              <span style={{ padding: '2px 8px', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--grad-primary)', color: '#fff', borderRadius: 4, boxShadow: 'var(--glow-primary)' }}>Admin</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>@{profile.name.toLowerCase().replace(/\s+/g, '')} &middot; Joined {joinDate}</p>
          </div>
          <Link href="/admin/write" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, background: 'var(--grad-primary)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none', boxShadow: 'var(--glow-primary)', transition: 'transform 0.2s var(--ease-out-expo), box-shadow 0.2s var(--ease-out-expo)' }}>
            <Plus size={14} /> New Article
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: 0 }}>
        {[
          { id: 'dashboard' as const, label: 'Dashboard', icon: TrendingUp },
          { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 22px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7,
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-tertiary)',
              borderBottom: '2px solid transparent',
              transition: 'all 0.2s var(--ease-out-expo)',
              ...(activeTab === tab.id ? { borderBottomColor: 'var(--primary)' } : {}),
            }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

{/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Main Content */}
        <main>
          {activeTab === 'dashboard' && (
            <div className="p-6 space-y-6">
              <RealtimeFeedFetcher initialArticlesCount={totalArticlesCount} />

                            {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {[
                  { Icon: Newspaper, label: 'Total Articles', value: totalArticlesCount.toLocaleString(), sub: `${published.length} published`, color: 'var(--primary)', bg: 'var(--primary-light)' },
                  { Icon: Clock, label: 'Pending Review', value: pending.length, sub: 'Awaiting approval', color: 'var(--warning)', bg: 'var(--warning-light)' },
                  { Icon: Users, label: 'Total Users', value: formatNumber(totalUsers), sub: `${journalistsCount} authors`, color: 'oklch(55% 0.15 250)', bg: 'oklch(55% 0.15 250 / 0.12)' },
                  { Icon: DollarSign, label: 'Revenue', value: formatCurrency(totalRevenue), sub: `${formatCurrency(pendingPayout)} pending`, color: 'var(--success)', bg: 'var(--success-light)' },
                ].map((stat, i) => {
                  const Icon = stat.Icon;
                  return (
                    <div
                      key={i}
                      className={`animate-fade-up delay-${(i + 1) * 100}`}
                      style={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
                        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--glow-soft)',
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: stat.bg, color: stat.color, flexShrink: 0 }}>
                        <Icon size={20} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{stat.label}</p>
                        <p style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>{stat.value}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0 }}>{stat.sub}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Live Author Activity Feed */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
                WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--glow-soft)',
                overflow: 'hidden',
              }}>
                <LiveAuthorFeed />
              </div>

              {/* Pending Journalist Applications */}
              {pendingApplications.length > 0 && (
                <div style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
                  WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--glow-soft)',
                  overflow: 'hidden',
                }} className="animate-fade-up">
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>📝</div>
                      <div>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Pending Journalist Applications</h3>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{pendingApplications.length} awaiting review</p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                    {pendingApplications.map((app) => (
                      <div key={app.user_id} className="px-6 py-4 flex items-center gap-4">
                        {app.profile_image ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                            <Image src={app.profile_image} alt={app.name} fill className="object-cover"  sizes="(max-width: 640px) 100vw, 50vw" loading="lazy"/>
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
                <div style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
                  WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--glow-soft)',
                  overflow: 'hidden',
                }}>
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--glass-border)' }}>
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

                {/* Revenue Card */}
                <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: 'var(--grad-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glow-primary)' }}>
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

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {/* Publish Limits */}
                <div className="lg:col-span-2" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur)) saturate(140%)', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glow-soft)', overflow: 'hidden' }}>
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Publish Limits</h3>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Max published articles surfaced per source type (0 = unlimited)</p>
                    </div>
                    <button
                      onClick={saveLimits}
                      disabled={savingLimits}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                      style={{ background: 'var(--grad-primary)', color: '#fff', boxShadow: 'var(--glow-primary)' }}
                    >
                      {savingLimits ? 'Saving…' : 'Save Limits'}
                    </button>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>In-House (max published)</span>
                      <input
                        type="number" min={0} max={500}
                        value={publishLimits.inhouse}
                        onChange={(e) => setPublishLimits({ ...publishLimits, inhouse: Math.max(0, Number(e.target.value) || 0) })}
                        className="mt-2 w-full px-3 py-2 rounded-lg text-sm"
                        style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Sourced / RSS (max published)</span>
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

                {/* Side Panel */}
                <div className="space-y-5">
                  {/* Pending Reviews */}
                  {pending.length > 0 && (
                    <div style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur)) saturate(140%)', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glow-soft)', overflow: 'hidden' }}>
                      <div className="px-5 py-4" style={{ background: 'var(--warning-light)', borderBottom: '1px solid var(--warning)' }}>
                        <h3 className="font-bold" style={{ color: 'var(--warning)' }}>Pending Review</h3>
                      </div>
                      <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                        {pending.slice(0, 3).map(a => (
                          <div key={a.article_id} className="p-4 flex items-center gap-3">
                            {a.featured_image && (
                              <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0">
                                <Image src={a.featured_image} alt={a.title} fill className="object-cover"  sizes="(max-width: 640px) 100vw, 50vw" loading="lazy"/>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>By {a.author?.name}</p>
                            </div>
                            <Link href={`/admin/review/${a.article_id}`} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors" style={{ background: 'var(--grad-primary)', color: '#fff' }}>
                              Review
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link href="/admin/articles" className="block w-full py-3 text-center rounded-xl font-semibold text-sm transition-colors" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur)) saturate(140%)', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)', border: '1px solid var(--glass-border)', color: 'var(--primary)' }}>
                    Manage all articles →
                  </Link>
                </div>
              </div>

              <LiveRegistrationsFeed initialUsers={recentUsers} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Settings */}
              <div className="lg:col-span-2" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur)) saturate(140%)', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glow-soft)', overflow: 'hidden' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Profile Settings</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Update your name and bio</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      style={{ width: 72, height: 72, borderRadius: 20, overflow: 'hidden', position: 'relative', cursor: 'pointer', flexShrink: 0, boxShadow: 'var(--glow-primary)' }}
                      title="Change avatar"
                    >
                      {profile.profile_image ? (
                        <Image src={profile.profile_image} alt={profile.name} fill style={{ objectFit: 'cover' }}  sizes="(max-width: 640px) 100vw, 50vw" loading="lazy"/>
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                          {profile.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
                        {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                      </button>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>JPG, PNG. Max 5MB.</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Bio</label>
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={4}
                      className="w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                      placeholder="Tell us about yourself..." />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={handleSaveProfile} disabled={savingProfile || !editName.trim()}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                      style={{ background: 'var(--grad-primary)', color: '#fff', boxShadow: 'var(--glow-primary)' }}>
                      {savingProfile ? 'Saving...' : profileSaved ? 'Saved!' : 'Save Changes'}
                    </button>
                    {profileSaved && <span className="text-sm font-medium" style={{ color: 'var(--success)', fontWeight: 600 }}>Profile saved.</span>}
                  </div>
                </div>
              </div>

              {/* Publish Limits */}
              <div style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur)) saturate(140%)', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glow-soft)', overflow: 'hidden', alignSelf: 'start' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Publish Limits</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Max articles per source (0 = unlimited)</p>
                </div>
                <div className="p-5 space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>In-House</span>
                    <input type="number" min={0} max={500} value={publishLimits.inhouse}
                      onChange={(e) => setPublishLimits({ ...publishLimits, inhouse: Math.max(0, Number(e.target.value) || 0) })}
                      className="mt-1.5 w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Sourced / RSS</span>
                    <input type="number" min={0} max={500} value={publishLimits.sourced}
                      onChange={(e) => setPublishLimits({ ...publishLimits, sourced: Math.max(0, Number(e.target.value) || 0) })}
                      className="mt-1.5 w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }} />
                  </label>
                  <button onClick={saveLimits} disabled={savingLimits}
                    className="w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                    style={{ background: 'var(--grad-primary)', color: '#fff', boxShadow: 'var(--glow-primary)' }}>
                    {savingLimits ? 'Saving...' : 'Save Limits'}
                  </button>
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
