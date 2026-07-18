'use client'
// @ts-nocheck

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser, useProfile } from '@/lib/hooks/useAuth'
import { useRealtime } from '@/components/providers/RealtimeProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { formatNumber, cn } from '@/lib/utils'
import {
  BookOpen, Clock, MessageSquare, Heart, TrendingUp, Target,
  Trophy, Sun, Moon, ArrowLeft, Sparkles,
} from 'lucide-react'
import { ProfileNav } from '@/components/layout/ProfileNav'
import { Logo } from '@/components/layout/Logo'

interface Profile {
  user_id: number
  name: string
  role: string
  bio: string | null
  profile_image: string | null
}

const CAT_COLORS: Record<string, string> = {
  Technology: 'oklch(45% 0.12 200)',
  Business: 'oklch(55% 0.14 55)',
  Science: 'oklch(50% 0.12 145)',
  Culture: 'oklch(50% 0.14 310)',
  Sports: 'oklch(55% 0.12 25)',
  Politics: 'oklch(50% 0.12 260)',
  Health: 'oklch(55% 0.12 110)',
  Entertainment: 'oklch(55% 0.13 330)',
}

function catColor(name: string) {
  return CAT_COLORS[name] ?? 'oklch(50% 0.12 175)'
}

// Animated count-up for the stat cards — eases from previous to next value.
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    const from = fromRef.current
    const to = target
    if (from === to) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (to - from) * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])
  return value
}

export default function ReaderStatsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { darkMode, toggleDarkMode } = useTheme()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  const { latestActivity } = useRealtime()

  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({ reads: 0, timeMinutes: 0, comments: 0, likes: 0, saved: 0, following: 0 })
  const [heatmap, setHeatmap] = useState<number[]>(new Array(28).fill(0))
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [mostRead, setMostRead] = useState<{ title: string; author: string; reads: number; minutes: number }[]>([])
  const [streak, setStreak] = useState(0)
  const [goals, setGoals] = useState<{ name: string; current: number; target: number }[]>([
    { name: 'Daily Articles', current: 0, target: 5 },
    { name: 'Weekly Minutes', current: 0, target: 120 },
    { name: 'Comments', current: 0, target: 10 },
    { name: 'New Topics', current: 0, target: 3 },
  ])
  const [weeklyChange, setWeeklyChange] = useState({ reads: 0, comments: 0, likes: 0, minutes: 0 })
  const [pulseKey, setPulseKey] = useState(0)

  // Animated (count-up) stat values
  const animReads = useCountUp(stats.reads)
  const animMinutes = useCountUp(stats.timeMinutes)
  const animComments = useCountUp(stats.comments)
  const animLikes = useCountUp(stats.likes)

  // resolve user id
  useEffect(() => {
    if (userLoading) return
    if (!user) {
      router.push('/login?redirect=/stats')
      return
    }
    ;(async () => {
      const { data } = await supabase.from('users').select('user_id').eq('auth_id', user.id).maybeSingle()
      const row = data as { user_id: number } | null
      if (row?.user_id) setUserId(row.user_id)
      setLoading(false)
    })()
  }, [user, userLoading, supabase, router])

  const loadAll = useCallback(async (uid: number) => {
    const now = new Date()
    const fourWeeksAgo = new Date(now)
    fourWeeksAgo.setDate(now.getDate() - 28)
    fourWeeksAgo.setHours(0, 0, 0, 0)

    const [reads, comments, likes, saved, following, weeklyReads, weeklyComments, weeklyLikes] = await Promise.all([
      supabase.from('article_reads').select('read_id, created_at, article_id').eq('user_id', uid),
      supabase.from('comments').select('comment_id, created_at, article_id').eq('user_id', uid),
      supabase.from('article_likes').select('id, created_at, article_id').eq('user_id', uid),
      supabase.from('saved_articles').select('saved_id').eq('user_id', uid),
      supabase.from('user_follows').select('follower_id').eq('follower_id', uid),
      supabase.from('article_reads').select('read_id, created_at, article_id').eq('user_id', uid).gte('created_at', fourWeeksAgo.toISOString()),
      supabase.from('comments').select('comment_id, created_at').eq('user_id', uid).gte('created_at', fourWeeksAgo.toISOString()),
      supabase.from('article_likes').select('id, created_at').eq('user_id', uid).gte('created_at', fourWeeksAgo.toISOString()),
    ])

    const readRows = (reads.data ?? []) as any[]
    const commentRows = (comments.data ?? []) as any[]
    const likeRows = (likes.data ?? []) as any[]
    const readArticleIds = Array.from(new Set(readRows.map((r) => r.article_id)))

    setStats({
      reads: readRows.length,
      comments: commentRows.length,
      likes: likeRows.length,
      saved: (saved.data ?? []).length,
      following: (following.data ?? []).length,
      timeMinutes: 0, // filled after fetching article reading times
    })

    // Build heatmap (last 28 days, oldest -> newest), level 0..4
    const heat = new Array(28).fill(0)
    const allStamped = [
      ...readRows.map((r) => r.created_at),
      ...likeRows.map((l) => l.created_at),
      ...commentRows.map((c) => c.created_at),
    ]
    for (const iso of allStamped) {
      const d = new Date(iso)
      const idx = Math.floor((d.getTime() - fourWeeksAgo.getTime()) / 86400000)
      if (idx >= 0 && idx < 28) heat[idx] += 1
    }
    setHeatmap(heat)

    // Streak — consecutive days (including today) with any activity
    const daySet = new Set(allStamped.map((iso) => new Date(iso).toISOString().slice(0, 10)))
    let s = 0
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    // allow today to count even if not yet crossed midnight
    while (true) {
      const key = cursor.toISOString().slice(0, 10)
      if (daySet.has(key)) {
        s += 1
        cursor.setDate(cursor.getDate() - 1)
      } else {
        // if streak is 0 and today has no activity yet, let streak start counting from yesterday
        if (s === 0 && key === new Date().toISOString().slice(0, 10)) {
          cursor.setDate(cursor.getDate() - 1)
          continue
        }
        break
      }
    }
    setStreak(s)

    // Fetch reading times + category + most read for read articles
    if (readArticleIds.length > 0) {
      const { data: arts } = await supabase
        .from('articles')
        .select('article_id, title, reading_time_minutes, category_id, author:users(name), categories(name)')
        .in('article_id', readArticleIds)
      const artRows = (arts ?? []) as any[]
      const totalMinutes = artRows.reduce((sum, a) => sum + (Number(a.reading_time_minutes) || 0), 0)
      setStats((prev) => ({ ...prev, timeMinutes: totalMinutes }))

      // Category breakdown
      const catCounts: Record<string, number> = {}
      for (const a of artRows) {
        const cname = a.categories?.name || 'Uncategorized'
        catCounts[cname] = (catCounts[cname] || 0) + 1
      }
      const catList = Object.entries(catCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
      setCategories(catList)

      // Most read — count of reads per article
      const perArticle: Record<number, number> = {}
      for (const r of readRows) perArticle[r.article_id] = (perArticle[r.article_id] || 0) + 1
      const byArticle = artRows
        .map((a) => ({
          title: a.title,
          author: a.author?.name || 'Staff',
          reads: perArticle[a.article_id] || 1,
          minutes: (Number(a.reading_time_minutes) || 0) * (perArticle[a.article_id] || 1),
        }))
        .sort((a, b) => b.reads - a.reads || b.minutes - a.minutes)
        .slice(0, 5)
      setMostRead(byArticle)

      const distinctCats = new Set(artRows.map((a) => a.categories?.name)).size
      setGoals((g) => g.map((goal) => {
        if (goal.name === 'Daily Articles') return { ...goal, current: Math.min(goal.target, Math.round(weeklyReads.data?.length ?? 0) || 0) }
        if (goal.name === 'Weekly Minutes') return { ...goal, current: Math.min(goal.target, totalMinutes) }
        if (goal.name === 'Comments') return { ...goal, current: Math.min(goal.target, (weeklyComments.data ?? []).length) }
        if (goal.name === 'New Topics') return { ...goal, current: Math.min(goal.target, distinctCats) }
        return goal
      }))
    }

    setWeeklyChange({
      reads: (weeklyReads.data ?? []).length,
      comments: (weeklyComments.data ?? []).length,
      likes: (weeklyLikes.data ?? []).length,
      minutes: 0,
    })
  }, [supabase])

  useEffect(() => {
    if (userId) loadAll(userId)
  }, [userId, loadAll])

  // Live refresh when a new activity lands for this user
  useEffect(() => {
    if (userId && latestActivity) {
      setPulseKey((k) => k + 1)
      loadAll(userId)
    }
  }, [latestActivity, userId, loadAll])

  // Recompute weekly minutes on weekly reads change
  useEffect(() => {
    if (stats.timeMinutes > 0) {
      setGoals((g) => g.map((goal) => goal.name === 'Weekly Minutes' ? { ...goal, current: Math.min(goal.target, stats.timeMinutes) } : goal))
    }
  }, [stats.timeMinutes])

  const heatLevels = useMemo(() => {
    const max = Math.max(1, ...heatmap)
    return heatmap.map((v) => {
      if (v === 0) return 0
      const ratio = v / max
      if (ratio > 0.75) return 4
      if (ratio > 0.5) return 3
      if (ratio > 0.25) return 2
      return 1
    })
  }, [heatmap])

  const maxCat = categories.length ? Math.max(...categories.map((c) => c.count)) : 1
  const fmtHours = (m: number) => {
    const h = m / 60
    return h >= 1 ? `${h.toFixed(1)}h` : `${m}m`
  }
  const displayName = (profile as Profile)?.name || user?.email?.split('@')[0] || 'Reader'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, padding: '0 24px' }}>
          <Logo size="md" href="/" />
          <button onClick={toggleDarkMode} className="icon-btn" style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }} className="profile-layout">
        <aside style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          <ProfileNav role="reader" userId={userId ?? undefined} />
        </aside>

        <main style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Link href="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
              <ArrowLeft size={14} /> Back to profile
            </Link>
          </div>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Your Reading Stats</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Hi {displayName}, here's how your reading habits look.
            </p>
          </div>

          {/* Streak */}
          <div className="streak-section" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 20, background: 'var(--accent-light)', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ fontSize: '2.5rem' }}>🔥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{streak} Day{streak === 1 ? '' : 's'} Streak!</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {streak > 0 ? `You've been active ${streak} day${streak === 1 ? '' : 's'} in a row. Keep it going!` : 'Start a reading streak today!'}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
                  const active = i < streak % 7 || (streak >= 7 && i < 7)
                  const isToday = i === (new Date().getDay() + 6) % 7
                  return (
                    <span key={i} style={{
                      width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 600,
                      background: active ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: active ? 'oklch(15% 0.02 55)' : 'var(--text-tertiary)',
                      border: `1px solid ${isToday ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    }}>{d}</span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div key={pulseKey} className="live-pulse" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
            <StatCard icon={<BookOpen size={22} />} value={formatNumber(animReads)} label="Articles Read" change={`+${weeklyChange.reads} this week`} />
            <StatCard icon={<Clock size={22} />} value={fmtHours(animMinutes)} label="Time Reading" change={`+${Math.round(stats.timeMinutes / 60)}h total`} />
            <StatCard icon={<MessageSquare size={22} />} value={formatNumber(animComments)} label="Comments Posted" change={`+${weeklyChange.comments} this week`} />
            <StatCard icon={<Heart size={22} />} value={formatNumber(animLikes)} label="Articles Liked" change={`+${weeklyChange.likes} this week`} />
          </div>

          {/* Heatmap */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} /> Reading Activity
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Last 4 weeks</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {heatLevels.map((lvl, i) => (
                <div
                  key={i}
                  title={`${heatmap[i]} interaction${heatmap[i] === 1 ? '' : 's'}`}
                  className={cn('heat-cell', lvl > 0 && `l${lvl}`)}
                  style={{ aspectRatio: '1', borderRadius: 4, background: lvl === 0 ? 'var(--bg-inset)' : undefined, transition: 'transform 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
              <span>4 weeks ago</span><span>Today</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end', fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
              <span>Less</span>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-inset)' }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary-light)' }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'oklch(75% 0.06 175)' }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'oklch(60% 0.09 175)' }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)' }} />
              <span>More</span>
            </div>
          </div>

          {/* Categories + Goals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Reading by Category</h2>
              {categories.length === 0 && <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>No category data yet.</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categories.map((c) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, minWidth: 90 }}>{c.name}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-inset)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, width: `${(c.count / maxCat) * 100}%`, background: catColor(c.name), transition: 'width 0.5s var(--ease-out-expo)' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', minWidth: 24, textAlign: 'right' }}>{c.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} style={{ color: 'var(--accent)' }} /> Reading Goals
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {goals.map((g) => {
                  const pct = Math.min(100, Math.round((g.current / g.target) * 100))
                  return (
                    <div key={g.name} style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 11 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{g.name}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{g.current}/{g.target}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: 'var(--primary)', width: `${pct}%`, transition: 'width 0.5s var(--ease-out-expo)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Most read */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24, marginTop: 24 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={16} style={{ color: 'var(--accent)' }} /> Most Read This Month
            </h2>
            {mostRead.length === 0 && <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>You haven't read any articles yet.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mostRead.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 9, background: 'var(--bg-inset)' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-tertiary)', minWidth: 20, textAlign: 'center' }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{m.author} · Read {m.reads} time{m.reads === 1 ? '' : 's'} · {m.minutes} min total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {latestActivity && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, fontSize: '0.72rem', color: 'var(--success)' }}>
              <Sparkles size={14} /> Live: your reading stats update in real time
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, change }: { icon: React.ReactNode; value: string; label: string; change: string }) {
  return (
    <div style={{ padding: 20, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 6, color: 'var(--primary)' }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFeatureSettings: "'tnum'" }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>{change}</div>
    </div>
  )
}
