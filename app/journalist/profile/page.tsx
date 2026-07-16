'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { BadgePill } from '@/components/ui/BadgePill'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { BarChart } from '@/components/ui/BarChart'
import { createClient } from '@/lib/supabase/client'
import { uploadProfileImage } from '@/lib/storage'
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Trophy, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, Eye, Edit, Trash2, Award, BarChart as BarChartIcon, Users, FileText, Settings, Star, Send, Camera, Loader2 } from 'lucide-react'

type Profile = {
  user_id: number; name: string; email: string; bio: string | null
  profile_image: string | null; badge_level: string | null; rank_score: number
  social_links: { organization?: string; portfolio?: string; phone?: string; twitter?: string; linkedin?: string } | null
}
type BadgeRow = { badge_type: string; badge_name: string }
type ArticleRow = { article_id: number; title: string; slug: string; status: string; featured_image: string | null; views: number; earnings: number; created_at: string }
type EarningsRow = { amount: number; payout_status: string; created_at: string; source: string }
type PayoutRow = { amount: number; journalist_cut: number; status: string; period_start: string; period_end: string; payment_method: string }

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-300'

export default function JournalistProfilePage() {
  const supabase = createClient()

  const [profile, setProfile]           = useState<Profile | null>(null)
  const [badges, setBadges]             = useState<BadgeRow[]>([])
  const [name, setName]                 = useState('')
  const [bio, setBio]                   = useState('')
  const [organization, setOrganization] = useState('')
  const [portfolio, setPortfolio]       = useState('')
  const [phone, setPhone]               = useState('')
  const [twitter, setTwitter]           = useState('')
  const [linkedin, setLinkedin]         = useState('')
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Dashboard data
  const [articles, setArticles]         = useState<ArticleRow[]>([])
  const [earnings, setEarnings]         = useState<EarningsRow[]>([])
  const [payouts, setPayouts]           = useState<PayoutRow[]>([])
  const [totalJournalists, setTotalJournalists] = useState(0)
  const [rank, setRank]                 = useState(1)
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState<'dashboard' | 'profile'>('dashboard')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('users')
          .select('user_id, name, email, bio, profile_image, badge_level, rank_score, social_links')
          .eq('email', user.email ?? '')
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

        // Load dashboard data
        const { data: arts } = await supabase.from('articles').select('article_id, title, slug, status, featured_image, views, earnings, created_at').eq('author_id', p.user_id).order('created_at', { ascending: false }).limit(20) as any
        setArticles((arts ?? []) as ArticleRow[])

        const { data: earns } = await supabase.from('earnings').select('amount, payout_status, created_at, source').eq('user_id', p.user_id).order('created_at', { ascending: false }).limit(50) as any
        setEarnings((earns ?? []) as EarningsRow[])

        const { data: payoutData } = await supabase.from('payout_requests').select('amount, journalist_cut, status, period_start, period_end, payment_method').eq('user_id', p.user_id).order('created_at', { ascending: false }).limit(5) as any
        setPayouts((payoutData ?? []) as PayoutRow[])

        const { count: totJ } = await supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never)
        const { count: abvJ } = await supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never).gt('rank_score', p.rank_score ?? 0)
        setTotalJournalists(totJ ?? 0)
        setRank((abvJ ?? 0) + 1)
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
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
    } catch {
      setError('Network error — try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.user_id) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    setUploadingAvatar(true)
    try {
      const { url } = await uploadProfileImage(file, profile.user_id)
      const res = await fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image: url }),
      })
      if (!res.ok) throw new Error('Failed')
      setProfile(p => p ? { ...p, profile_image: url } : p)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Avatar upload failed')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading profile…</span>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Account not found</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Your account is not set up yet. Please contact an admin.</p>
          <Link href="/" className="inline-block px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>Go Home</Link>
        </div>
      </div>
    )
  }

  const totalViews = articles.reduce((s, a) => s + (a.views ?? 0), 0)
  const totalEarnings = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthEarnings = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)
  const published = articles.filter(a => a.status === 'published')
  const drafts = articles.filter(a => a.status === 'draft')
  const underReview = articles.filter(a => a.status === 'under_review')
  const pendingAmount = earnings.filter(e => e.payout_status === 'pending').reduce((s, e) => s + Number(e.amount), 0)

  const chartData: number[] = []
  const chartLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    chartLabels.push(d.toLocaleString('default', { month: 'short' }))
    chartData.push(earnings.filter(e => e.created_at.startsWith(ym)).reduce((s, e) => s + Number(e.amount), 0))
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="profile-tabs" style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setActiveTab('dashboard')}
          className="profile-tab-btn"
          style={{ fontWeight: 500, color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-tertiary)', borderBottomColor: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent' }}>
          Dashboard
        </button>
        <button onClick={() => setActiveTab('profile')}
          className="profile-tab-btn"
          style={{ fontWeight: 500, color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-tertiary)', borderBottomColor: activeTab === 'profile' ? 'var(--primary)' : 'transparent' }}>
          Profile
        </button>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-5">
        {activeTab === 'dashboard' && (
          <>
            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-2xl shadow-sm overflow-x-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <span className="font-bold whitespace-nowrap" style={{ color: 'var(--primary)' }}>🏅 Badges</span>
                {badges.map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_name} />)}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Views" value={formatNumber(totalViews)} sub="All time" accent="kenya" icon="👁" />
              <StatCard label="Total Earnings" value={formatCurrency(totalEarnings)} sub={`This month: ${formatCurrency(monthEarnings)}`} accent="kenya" icon="💰" />
              <StatCard label="Articles" value={published.length} sub={`${drafts.length} drafts · ${underReview.length} in review`} accent="kenya" icon="📰" />
              <StatCard label="Ranking" value={`#${rank}`} sub={`of ${totalJournalists}`} accent="kenya" icon="🏆" />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Recent Articles */}
              <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>📰 Your Articles</h3>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Manage your content</p>
                  </div>
                  <Link href="/journalist/create" className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                    ➕ New
                  </Link>
                </div>
                <div className="max-h-[320px] overflow-y-auto" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {articles.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                      <p className="mb-3">No articles yet</p>
                      <Link href="/journalist/create" className="inline-block px-4 py-2 font-semibold rounded-lg transition-colors" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                        Create your first article
                      </Link>
                    </div>
                  ) : articles.slice(0, 6).map(a => (
                    <div key={a.article_id} className="px-6 py-4 flex items-center gap-4 transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {a.featured_image ? (
                        <div className="relative w-14 h-11 rounded-lg overflow-hidden shrink-0">
                          <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-11 rounded-lg flex items-center justify-center text-xl" style={{ background: 'var(--bg-muted)' }}>📰</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{formatDate(a.created_at)} · 👁 {formatNumber(a.views)}</p>
                      </div>
                      <div className="text-right">
                        <Badge status={a.status} />
                        <p className="text-sm font-bold mt-1" style={{ color: 'var(--primary)' }}>{formatCurrency(a.earnings)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings Chart */}
              <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>💰 Earnings Overview</h3>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Last 6 months performance</p>
                </div>
                <div className="p-6">
                  <BarChart data={chartData} labels={chartLabels} height={100} />
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(totalEarnings)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: 'var(--warning)' }}>{formatCurrency(monthEarnings)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>This Month</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(pendingAmount)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout History */}
            {payouts.length > 0 && (
              <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>💸 Payout History</h3>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Your payment records</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ background: 'var(--bg-muted)' }}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Period</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Your Cut (50%)</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Method</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p, i) => (
                        <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.period_start} → {p.period_end}</td>
                          <td className="px-6 py-4 font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(Number(p.journalist_cut))}</td>
                          <td className="px-6 py-4 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>{p.payment_method}</td>
                          <td className="px-6 py-4"><Badge status={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CTA Banner */}
            <div className="rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg" style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-inverse)' }}>Ready to publish your next story?</h3>
                <p className="text-sm" style={{ color: 'var(--text-inverse)', opacity: 0.7 }}>Create, submit, and start earning from your writing today.</p>
              </div>
              <div className="flex gap-3">
                <Link href="/journalist/create" className="px-5 py-2.5 font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'var(--warning)', color: 'var(--text-primary)' }}>
                  ✏️ New Article
                </Link>
                <Link href="/leaderboard" className="px-5 py-2.5 font-semibold rounded-xl transition-all hover:bg-white/10" style={{ border: '2px solid rgba(255,255,255,0.4)', color: 'var(--text-inverse)' }}>
                  🏆 Leaderboard
                </Link>
              </div>
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <>
            {/* Profile hero card */}
            <div className="rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="h-28" style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover), var(--accent))' }} />
              <div className="px-6 pb-6">
                <div className="flex items-end gap-4 -mt-10 mb-4">
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative shrink-0 cursor-pointer group"
                    title="Change avatar"
                  >
                    {profile.profile_image ? (
                      <Image
                        src={profile.profile_image} alt={profile.name}
                        width={80} height={80}
                        className="rounded-full ring-4 ring-white object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full ring-4 ring-white flex items-center justify-center text-2xl font-black shadow-md"
                        style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        {profile.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}>
                      {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                  <div className="pb-1">
                    <h2 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>{profile.name}</h2>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{profile.email}</p>
                  </div>
                </div>

                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {badges.map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_name} />)}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold" style={{ color: 'var(--warning)' }}>🏆 Rank Score: {Math.round(profile.rank_score ?? 0).toLocaleString()}</span>
                  {profile.badge_level && (
                    <BadgePill type={profile.badge_level} label={`Level: ${profile.badge_level}`} />
                  )}
                </div>
              </div>
            </div>

            {/* Edit form */}
            <form onSubmit={handleSave} className="rounded-2xl shadow-sm p-6 space-y-4 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Edit Profile</h3>
              </div>

              {error && (
                <div role="alert" className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)' }}>
                  {error}
                </div>
              )}
              {saved && (
                <div role="status" className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--primary)' }}>
                  ✅ Profile saved successfully.
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    className={inputCls}
                    style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Organization</label>
                  <input type="text" value={organization} onChange={e => setOrganization(e.target.value)}
                    placeholder="Your news outlet"
                    className={inputCls}
                    style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Bio</label>
                <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Tell readers about yourself and what you cover…"
                  className={inputCls + ' resize-none'}
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Portfolio / Website</label>
                  <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                    placeholder="https://yoursite.com"
                    className={inputCls}
                    style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Phone / M-Pesa</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+254..."
                    className={inputCls}
                    style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>X / Twitter</label>
                  <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)}
                    placeholder="@handle"
                    className={inputCls}
                    style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>LinkedIn</label>
                  <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className={inputCls}
                    style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button type="submit" disabled={saving}
                  className="font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                {saved && (
                  <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>✓ Saved!</span>
                )}
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  )
}