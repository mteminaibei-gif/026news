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
type ArticleRow = { article_id: number; title: string; slug: string; status: string; featured_image: string | null; views: number; earnings: number; created_at: string; content?: string }
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

        // Load dashboard data
        const { data: arts } = await supabase.from('articles').select('article_id, title, slug, status, featured_image, views, earnings, created_at, content').eq('author_id', p.user_id).order('created_at', { ascending: false }).limit(20) as any
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
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading profile…</span>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
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

  const totalReadTime = articles.reduce((s, a) => s + Math.max(0, Math.round((a.content?.length ?? 0) / 1800)), 0)

  return (
    <div className="space-y-6">
      {/* ── Header Action Strip ── */}
      <div className="flex items-center justify-between p-4 rounded-2xl shadow-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: 'var(--primary)', color: '#fff' }}>
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-extrabold text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {profile.name}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span className="font-semibold" style={{ color: 'var(--primary)' }}>Verified Author</span>
              <span className="mx-2">·</span>
              {organization || 'Independent Journalist'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badges.length > 0 && badges.slice(0, 3).map(b => (
            <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_name} />
          ))}
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            Active
          </span>
        </div>
      </div>

      {/* ── Performance Metric Grid: 4 Columns ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Published" value={published.length} sub="Total articles published" accent="kenya" icon="📰" />
        <StatCard label="Monthly Views" value={formatNumber(totalViews)} sub="All-time cumulative" accent="kenya" icon="👁" />
        <StatCard label="Read Duration" value={`${totalReadTime} min`} sub="Total estimated read time" accent="kenya" icon="⏱" />
        <StatCard label="In Review" value={underReview.length} sub="Awaiting approval" accent="kenya" icon="⏳" />
      </div>

      {/* ── Identity Form Card ── */}
      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Public Media Card Settings</h3>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
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

          {/* Block A: Avatar + Upload */}
          <div className="flex items-center gap-6">
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <div onClick={() => avatarInputRef.current?.click()} className="relative shrink-0 cursor-pointer group" title="Change avatar">
              {profile.profile_image ? (
                <Image src={profile.profile_image} alt={profile.name} width={80} height={80}
                  className="rounded-full ring-4 ring-white object-cover shadow-md" style={{ width: 80, height: 80 }} />
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
            <div>
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
              </button>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>JPG, PNG. Max 5MB.</p>
            </div>
          </div>

          {/* Block B: Core Information */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Display Byline Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className={inputCls}
                style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Primary Reporting Beat</label>
              <input type="text" value={organization} onChange={e => setOrganization(e.target.value)}
                placeholder="e.g. Politics, Technology, Sports"
                className={inputCls}
                style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          {/* Block C: Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Professional Bio</label>
            <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell readers about yourself and what you cover..."
              className={inputCls + ' resize-none'}
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          {/* Block D: Save */}
          <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="submit" disabled={saving}
              className="font-bold px-8 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              {saving ? 'Saving...' : 'Save Byline Update'}
            </button>
            {saved && (
              <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>✓ Saved!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}