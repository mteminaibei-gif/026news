'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { Badge } from '@/components/ui/Badge'
import { BadgePill } from '@/components/ui/BadgePill'
import { Card, Button, EmptyState } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { uploadProfileImage } from '@/lib/storage'
import { useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/lib/hooks/useAuth'
import { formatNumber, formatCurrency, formatDate } from '@/lib/utils'
import {
  Plus, Eye, Edit, Award, Users, FileText, Settings, Star, Camera, Loader2,
  TrendingUp, DollarSign, UserPlus, BarChart3,
} from 'lucide-react'

/* ───────────────────────── types ───────────────────────── */

type Profile = {
  user_id: number; name: string; email: string; bio: string | null
  profile_image: string | null; badge_level: string | null; rank_score: number
  follower_count: number; subscribers: number
  social_links: { organization?: string; portfolio?: string; phone?: string; twitter?: string; linkedin?: string } | null
}
type BadgeRow = { badge_type: string; badge_name: string }
type ArticleRow = { article_id: number; title: string; slug: string; status: string; featured_image: string | null; views: number; earnings: number; created_at: string; content?: string; category?: { name: string } | null }
type EarningRow = { earning_id: number; amount: number; source: string; payout_status: string; created_at: string; article_id: number | null }
type PayoutRow = { payout_id: number; amount: number; journalist_cut: number; status: string; period_start: string; period_end: string; payment_method: string; created_at: string }
type FollowerUser = { user_id: number; name: string; profile_image: string | null; role: string }
type Follower = { follower_id: number; created_at: string; users: FollowerUser }
type SubscriberUser = { user_id: number; name: string; email: string; profile_image: string | null }
type Subscriber = { user_id: number; plan: 'Free' | 'Pro' | 'Premium'; subscribed_at: string; users: SubscriberUser }

const STUDIO_TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'articles', label: 'Articles', icon: '📰' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'earnings', label: 'Earnings', icon: '💰' },
  { id: 'followers', label: 'Followers', icon: '👥' },
  { id: 'subscribers', label: 'Subscribers', icon: '🔔' },
  { id: 'profile', label: 'Profile', icon: '👤' },
] as const
type TabId = (typeof STUDIO_TABS)[number]['id']

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-300'

/* ───────────────────────── page shell ───────────────────────── */

export default function JournalistStudioPage() {
  return (
    <Suspense fallback={<StudioLoading />}>
      <StudioInner />
    </Suspense>
  )
}

function StudioLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading studio…</span>
      </div>
    </div>
  )
}

function StudioInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)

  /* data */
  const [profile, setProfile] = useState<Profile | null>(null)
  const [badges, setBadges] = useState<BadgeRow[]>([])
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [earnings, setEarnings] = useState<EarningRow[]>([])
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [followers, setFollowers] = useState<Follower[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [totalJournalists, setTotalJournalists] = useState(0)
  const [rank, setRank] = useState(1)

  /* profile edit form */
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [organization, setOrganization] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [phone, setPhone] = useState('')
  const [twitter, setTwitter] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  /* deep-link ?tab= */
  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && STUDIO_TABS.some(tab => tab.id === t)) {
      setActiveTab(t as TabId)
    }
  }, [searchParams])

  const goTab = useCallback((id: TabId) => {
    setActiveTab(id)
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('tab', id)
    router.replace(`/journalist?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('users')
          .select('user_id, name, email, bio, profile_image, badge_level, rank_score, follower_count, subscribers, social_links')
          .eq('auth_id', user.id)
          .single()
        if (!data) return
        const p = data as unknown as Profile
        setProfile(p)
        setName(p.name)
        setBio(p.bio ?? '')
        setOrganization(p.social_links?.organization ?? '')
        setPortfolio(p.social_links?.portfolio ?? '')
        setPhone(p.social_links?.phone ?? '')
        setTwitter(p.social_links?.twitter ?? '')
        setLinkedin(p.social_links?.linkedin ?? '')

        const { data: bdg } = await supabase
          .from('journalist_badges').select('badge_type, badge_name').eq('user_id', p.user_id)
        setBadges((bdg ?? []) as BadgeRow[])

        const { data: arts } = await supabase
          .from('articles')
          .select('article_id, title, slug, status, featured_image, views, earnings, created_at, content, category:categories(name)')
          .eq('author_id', p.user_id)
          .order('created_at', { ascending: false })
          .limit(50) as any
        setArticles((arts ?? []) as ArticleRow[])

        const { data: earns } = await supabase
          .from('earnings').select('earning_id, amount, source, payout_status, created_at, article_id')
          .eq('user_id', p.user_id).order('created_at', { ascending: false }).limit(50) as any
        setEarnings((earns ?? []) as EarningRow[])

        const { data: payoutData } = await supabase
          .from('payout_requests').select('payout_id, amount, journalist_cut, status, period_start, period_end, payment_method, created_at')
          .eq('user_id', p.user_id).order('created_at', { ascending: false }).limit(5) as any
        setPayouts((payoutData ?? []) as PayoutRow[])

        const { data: foll } = await supabase
          .from('user_follows')
          .select('follower_id, created_at, users!inner(user_id, name, profile_image, role)')
          .eq('following_id', p.user_id)
          .order('created_at', { ascending: false })
          .limit(50) as any
        setFollowers((foll ?? []) as Follower[])

        const { data: subs } = await (supabase.from('subscribers' as never) as any)
          .select('user_id, plan, subscribed_at, users!inner(user_id, name, email, profile_image)')
          .eq('journalist_id', p.user_id)
          .order('subscribed_at', { ascending: false }) as any
        setSubscribers((subs ?? []) as Subscriber[])

        const { count: totJ } = await supabase
          .from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never)
        const { count: abvJ } = await supabase
          .from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never)
          .gt('rank_score', p.rank_score ?? 0)
        setTotalJournalists(totJ ?? 0)
        setRank((abvJ ?? 0) + 1)
      } catch (err) {
        console.error('Error loading studio:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/journalist/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, organization, portfolio, phone, twitter, linkedin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) queryClient.invalidateQueries({ queryKey: authKeys.profile(user.email) })
      } catch { /* non-fatal */ }
    } catch {
      setError('Network error — try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.user_id) return
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
    setUploadingAvatar(true)
    try {
      const { url } = await uploadProfileImage(file, profile.user_id)
      const res = await fetch('/api/profile/avatar', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image: url }),
      })
      if (!res.ok) throw new Error('Failed')
      setProfile(pp => pp ? { ...pp, profile_image: url } : pp)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Avatar upload failed')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  if (loading) return <StudioLoading />
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Account not found</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Your account is not set up yet. Please complete onboarding or contact an admin.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/onboarding" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>Complete Onboarding</Link>
            <Link href="/" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--bg-inset)', color: 'var(--text-primary)' }}>Go Home</Link>
          </div>
        </div>
      </div>
    )
  }

  /* derived */
  const published = articles.filter(a => a.status === 'published')
  const drafts = articles.filter(a => a.status === 'draft')
  const underReview = articles.filter(a => a.status === 'under_review')
  const totalViews = published.reduce((s, a) => s + (a.views ?? 0), 0)
  const totalEarnings = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const pendingEarnings = earnings.filter(e => e.payout_status === 'pending').reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthEarnings = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)
  const totalReadTime = articles.reduce((s, a) => s + Math.max(0, Math.round((a.content?.length ?? 0) / 1800)), 0)
  const avgViews = published.length ? Math.round(totalViews / published.length) : 0

  const monthLabels: string[] = []
  const viewsByMonth: number[] = []
  const earnsByMonth: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    monthLabels.push(d.toLocaleString('default', { month: 'short' }))
    viewsByMonth.push(published.filter(a => a.created_at?.startsWith(ym)).reduce((s, a) => s + (a.views ?? 0), 0))
    earnsByMonth.push(earnings.filter(e => e.created_at.startsWith(ym)).reduce((s, e) => s + Number(e.amount), 0))
  }
  const topArticles = [...published].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 10)

  const sourceBreakdown = earnings.reduce((acc, e) => {
    acc[e.source] = (acc[e.source] || 0) + Number(e.amount); return acc
  }, {} as Record<string, number>)
  const sourceEntries = Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])
  const totalSource = sourceEntries.reduce((s, [, v]) => s + v, 0) || 1

  const paidSubs = subscribers.filter(s => s.plan !== 'Free').length
  const freeSubs = subscribers.filter(s => s.plan === 'Free').length
  const subMonths: string[] = []
  const subsByMonth: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    subMonths.push(d.toLocaleString('default', { month: 'short' }))
    subsByMonth.push(subscribers.filter(s => s.subscribed_at.startsWith(ym)).length)
  }

  const sourceColors: Record<string, string> = {
    ads: 'linear-gradient(to right, var(--primary), var(--accent))',
    subscriptions: 'linear-gradient(to right, var(--warning), var(--warning))',
    sponsored: 'linear-gradient(to right, var(--error), #e03050)',
  }
  const planColors: Record<string, { background: string; color: string }> = {
    Pro: { background: 'var(--warning-light)', color: 'var(--warning)' },
    Premium: { background: 'var(--success-light)', color: 'var(--primary)' },
    Free: { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' },
  }

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      {/* Identity strip */}
      <div className="flex items-center justify-between p-4 rounded-2xl shadow-sm mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: 'var(--primary)', color: '#fff' }}>
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-extrabold text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{profile.name}</h1>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span className="font-semibold" style={{ color: 'var(--primary)' }}>Verified Author</span>
              <span className="mx-2">·</span>
              {organization || 'Independent Journalist'}
              <span className="mx-2">·</span>
              Rank #{rank} of {totalJournalists}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badges.slice(0, 3).map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_name} />)}
          <Link href="/journalist/create"
            className="font-bold px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex items-center gap-1.5"
            style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
            <Plus size={15} /> New Article
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 rounded-2xl p-1.5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {STUDIO_TABS.map(t => (
          <button key={t.id} onClick={() => goTab(t.id)}
            className="flex-1 min-w-[44%] sm:min-w-0 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
            style={{
              background: activeTab === t.id ? 'var(--primary)' : 'transparent',
              color: activeTab === t.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
            }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ───────── Overview ───────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Published" value={published.length} sub="Total articles published" accent="kenya" icon="📰" />
            <StatCard label="Total Views" value={formatNumber(totalViews)} sub={`${avgViews} avg / article`} accent="kenya" icon="👁" />
            <StatCard label="Earnings" value={formatCurrency(totalEarnings)} sub={`${formatCurrency(pendingEarnings)} pending`} accent="kenya" icon="💰" />
            <StatCard label="Read Time" value={`${totalReadTime} min`} sub="Total estimated" accent="kenya" icon="⏱" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Followers" value={formatNumber(profile.follower_count || followers.length)} sub="People following you" accent="kenya" icon="👥" />
            <StatCard label="Subscribers" value={formatNumber(profile.subscribers || subscribers.length)} sub={`${paidSubs} paid`} accent="kenya" icon="🔔" />
            <StatCard label="In Review" value={underReview.length} sub="Awaiting approval" accent="kenya" icon="⏳" />
            <StatCard label="Drafts" value={drafts.length} sub="Unpublished" accent="kenya" icon="📝" />
          </div>
          <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>📈 Views (Last 6 Months)</h2>
            <BarChart data={viewsByMonth.length ? viewsByMonth : [0, 0, 0, 0, 0, 0]} labels={monthLabels.length ? monthLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']} />
          </div>
        </div>
      )}

      {/* ───────── Articles ───────── */}
      {activeTab === 'articles' && (
        <ArticlesSection articles={articles} userName={profile.name} />
      )}

      {/* ───────── Analytics ───────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Views" value={formatNumber(totalViews)} sub={`${published.length} published`} accent="green" />
            <StatCard label="Avg Views/Article" value={formatNumber(avgViews)} sub={`across ${published.length} articles`} accent="green" />
            <StatCard label="Total Earnings" value={`KES ${totalEarnings.toLocaleString()}`} sub={`${drafts.length} drafts · ${underReview.length} review`} accent="gold" />
            <StatCard label="Published" value={String(published.length)} sub={`${underReview.length} pending`} accent="green" />
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>📈 Views (Last 6 Months)</h2>
              <BarChart data={viewsByMonth.length ? viewsByMonth : [0, 0, 0, 0, 0, 0]} labels={monthLabels} />
            </div>
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>🏆 Top Articles</h2>
              <div className="space-y-3">
                {topArticles.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No published articles yet</p>
                ) : topArticles.map((a, i) => (
                  <div key={a.article_id} className="flex items-center gap-3">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-muted)', width: 20 }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatNumber(a.views ?? 0)} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <AllArticlesTable articles={articles} />
        </div>
      )}

      {/* ───────── Earnings ───────── */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Earnings" value={formatCurrency(totalEarnings)} sub="All time" accent="kenya" icon="💰" />
            <StatCard label="This Month" value={formatCurrency(monthEarnings)} sub="Current month" accent="kenya" icon="📈" />
            <StatCard label="Pending Payout" value={formatCurrency(pendingEarnings)} sub="Awaiting processing" accent="kenya" icon="⏳" />
            <StatCard label="Avg per Article" value={formatCurrency(published.length ? totalEarnings / published.length : 0)} sub={`${published.length} articles`} accent="kenya" icon="📊" />
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Monthly Earnings</h2>
              <BarChart data={earnsByMonth} labels={monthLabels} height={100} />
            </div>
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Revenue Sources</h2>
              <div className="space-y-3">
                {sourceEntries.length === 0 && <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No earnings data yet.</p>}
                {sourceEntries.map(([source, amount]) => {
                  const percent = Math.round((amount / totalSource) * 100)
                  return (
                    <div key={source}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: 'var(--text-secondary)' }}>{source.charAt(0).toUpperCase() + source.slice(1)}</span>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{percent}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: sourceColors[source] || sourceColors.ads }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>Payouts processed every 15th of the month</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
              <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>Transaction History</h2>
            </div>
            <div className="overflow-x-auto">
              {earnings.length === 0 ? (
                <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}><p>No transactions yet.</p></div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--primary)' }}>
                      <th className="px-4 py-3 text-left">Source</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map(e => (
                      <tr key={e.earning_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="px-4 py-3 font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>{e.source}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(Number(e.amount))}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-4 py-3"><Badge status={e.payout_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────── Followers ───────── */}
      {activeTab === 'followers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="font-extrabold mb-1" style={{ color: 'var(--primary)' }}>Followers</h2>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatNumber(profile.follower_count || followers.length)}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>People following you</p>
            </div>
          </div>
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
              <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>Your Followers</h2>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Showing {Math.min(followers.length, 50)} of {formatNumber(profile.follower_count || followers.length)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--primary)' }}>
                    <th className="px-4 py-3 text-left">Follower</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Since</th>
                  </tr>
                </thead>
                <tbody>
                  {followers.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>No followers yet.</td></tr>
                  ) : followers.map((f) => (
                    <tr key={f.follower_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {f.users?.profile_image ? (
                            <Image src={f.users.profile_image} alt={f.users.name} width={28} height={28} className="rounded-full object-cover" style={{ border: '2px solid var(--border-subtle)' }} />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--primary)' }}>
                              {(f.users?.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <Link href={`/journalists/${f.users?.user_id}`} className="font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>{f.users?.name || 'Unknown'}</Link>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{f.users?.role || 'reader'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(f.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────── Subscribers ───────── */}
      {activeTab === 'subscribers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Subscribers" value={formatNumber(profile.subscribers || subscribers.length)} sub="All time" accent="green" />
            <StatCard label="Paid Members" value={String(paidSubs)} sub="Active subscriptions" accent="gold" />
            <StatCard label="Free Members" value={String(freeSubs)} sub="Free tier" accent="green" />
            <StatCard label="This Month" value={String(subsByMonth[subsByMonth.length - 1] || 0)} sub="New subscriptions" accent="green" />
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Subscriber Growth</h2>
              <BarChart data={subsByMonth} labels={subMonths} />
            </div>
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Plan Breakdown</h2>
              <div className="space-y-4">
                {[
                  { plan: 'Pro', count: paidSubs > 0 ? Math.floor(paidSubs * 0.2) : 0 },
                  { plan: 'Premium', count: paidSubs > 0 ? Math.floor(paidSubs * 0.8) : 0 },
                  { plan: 'Free', count: freeSubs },
                ].map(p => (
                  <div key={p.plan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{p.plan}</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(profile.subscribers || subscribers.length) > 0 ? (p.count / (profile.subscribers || subscribers.length)) * 100 : 0}%`, background: planColors[p.plan as 'Pro' | 'Premium' | 'Free'].background }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl p-3 text-center" style={{ background: 'var(--primary-light)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>💡 Upgrade free readers with exclusive content!</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
              <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>Recent Subscribers</h2>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Showing {Math.min(subscribers.length, 5)} of {formatNumber(profile.subscribers || subscribers.length)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--primary)' }}>
                    <th className="px-4 py-3 text-left">Subscriber</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Since</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.slice(0, 5).map(s => (
                    <tr key={s.user_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {s.users?.profile_image ? (
                            <Image src={s.users.profile_image} alt={s.users.name} width={28} height={28} className="rounded-full object-cover" style={{ border: '2px solid var(--border-subtle)' }} />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--primary)' }}>{s.users?.name?.charAt(0).toUpperCase() ?? '?'}</div>
                          )}
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.users?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{s.users?.email}</td>
                      <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-bold" style={planColors[s.plan]}>{s.plan}</span></td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(s.subscribed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    </tr>
                  ))}
                  {subscribers.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>No subscribers yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────── Profile ───────── */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Public Media Card Settings</h3>
            </div>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {error && <div role="alert" className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)' }}>{error}</div>}
            {saved && <div role="status" className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--primary)' }}>✅ Profile saved successfully.</div>}
            <div className="flex items-center gap-6">
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <div onClick={() => avatarInputRef.current?.click()} className="relative shrink-0 cursor-pointer group" title="Change avatar">
                {profile.profile_image ? (
                  <Image src={profile.profile_image} alt={profile.name} width={80} height={80} className="rounded-full ring-4 ring-white object-cover shadow-md" style={{ width: 80, height: 80 }} />
                ) : (
                  <div className="w-20 h-20 rounded-full ring-4 ring-white flex items-center justify-center text-2xl font-black shadow-md" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{profile.name.charAt(0)}</div>
                )}
                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </div>
              </div>
              <div>
                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                  {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                </button>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>JPG, PNG. Max 5MB.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Display Byline Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Primary Reporting Beat</label>
                <input type="text" value={organization} onChange={e => setOrganization(e.target.value)} placeholder="e.g. Politics, Technology, Sports" className={inputCls} style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Professional Bio</label>
              <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell readers about yourself and what you cover..." className={inputCls + ' resize-none'} style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Portfolio URL</label>
                <input type="text" value={portfolio} onChange={e => setPortfolio(e.target.value)} className={inputCls} style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Twitter / X</label>
                <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)} className={inputCls} style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>LinkedIn</label>
                <input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} className={inputCls} style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="submit" disabled={saving} className="font-bold px-8 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md disabled:opacity-50" style={{ background: 'var(--primary)', color: '#fff' }}>
                {saving ? 'Saving...' : 'Save Byline Update'}
              </button>
              {saved && <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>✓ Saved!</span>}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── sections ───────────────────────── */

function ArticlesSection({ articles, userName }: { articles: ArticleRow[]; userName: string }) {
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [local, setLocal] = useState(articles)
  useEffect(() => { setLocal(articles) }, [articles])

  const stats = [
    { label: 'Total', count: local.length, color: 'var(--primary)' },
    { label: 'Published', count: local.filter(a => a.status === 'published').length, color: 'var(--primary)' },
    { label: 'Under Review', count: local.filter(a => a.status === 'under_review').length, color: 'var(--warning)' },
    { label: 'Drafts', count: local.filter(a => a.status === 'draft').length, color: 'var(--text-tertiary)' },
  ]

  async function submitForReview(id: number) {
    setSubmitting(id)
    try {
      const res = await fetch('/api/articles/update-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: id, action: 'submit' }),
      })
      if (res.ok) setLocal(prev => prev.map(a => a.article_id === id ? { ...a, status: 'under_review' } : a))
    } catch { /* no-op */ } finally { setSubmitting(null) }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4 shadow-sm text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="text-3xl font-extrabold" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--primary)' }}>
                <th className="px-4 py-3 text-left">Article</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Views</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {local.map(a => (
                <tr key={a.article_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {a.featured_image ? (
                        <div className="relative w-12 h-9 rounded-lg overflow-hidden shrink-0">
                          <Image src={a.featured_image} alt={a.title} fill className="object-cover" unoptimized sizes="48px" loading="lazy" />
                        </div>
                      ) : (
                        <div className="w-12 h-9 rounded-lg shrink-0 flex items-center justify-center text-sm" style={{ background: 'var(--bg-muted)' }}>📰</div>
                      )}
                      <p className="font-semibold line-clamp-2 max-w-xs" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{a.category?.name ?? '—'}</td>
                  <td className="px-4 py-3"><Badge status={a.status as 'draft' | 'under_review' | 'published' | 'rejected'} /></td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {a.status === 'published' && (
                        <Link href={`/article/${a.slug}`} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>View</Link>
                      )}
                      {(a.status === 'draft' || a.status === 'rejected') && (
                        <>
                          <Link href={`/journalist/edit/${a.article_id}`} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ color: 'var(--warning)', background: 'var(--warning-light)' }}>Edit</Link>
                          <button onClick={() => submitForReview(a.article_id)} disabled={submitting === a.article_id}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-40" style={{ color: 'var(--text-inverse)', background: 'var(--primary)' }}>
                            {submitting === a.article_id ? 'Submitting…' : 'Submit'}
                          </button>
                        </>
                      )}
                      {a.status === 'under_review' && (
                        <span className="text-xs px-2.5 py-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-muted)' }}>Pending</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {local.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No articles yet. <Link href="/journalist/create" style={{ color: 'var(--primary)' }}>Write your first article →</Link></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function AllArticlesTable({ articles }: { articles: ArticleRow[] }) {
  if (articles.length === 0) {
    return <div className="rounded-2xl p-8 text-center text-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>No articles yet</div>
  }
  return (
    <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>📋 All Articles</h2>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 500 }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-muted)' }}>
              <th className="text-left px-5 py-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>Title</th>
              <th className="text-left px-5 py-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>Status</th>
              <th className="text-right px-5 py-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>Views</th>
              <th className="text-right px-5 py-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>Earnings</th>
            </tr>
          </thead>
          <tbody>
            {articles.map(a => (
              <tr key={a.article_id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{
                    background: a.status === 'published' ? 'var(--success-light)' : a.status === 'under_review' ? 'var(--warning-light)' : 'var(--bg-muted)',
                    color: a.status === 'published' ? 'var(--success)' : a.status === 'under_review' ? 'var(--warning)' : 'var(--text-tertiary)',
                  }}>{a.status}</span>
                </td>
                <td className="px-5 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{formatNumber(a.views ?? 0)}</td>
                <td className="px-5 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>KES {Number(a.earnings ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
