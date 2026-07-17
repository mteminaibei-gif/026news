'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/components/providers/RealtimeProvider'
import { timeAgo, formatNumber } from '@/lib/utils'
import { BookOpen, Radio, Tv, Activity as ActivityIcon, Loader2, Coins } from 'lucide-react'

interface ActivityRow {
  id: number
  kind: 'read' | 'listen' | 'watch'
  ref_id: number | string
  name?: string
  created_at: string
}

export default function ActivityPage() {
  const supabase = createClient()
  const { latestActivity } = useRealtime()
  const [userId, setUserId] = useState<number | null>(null)
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [counts, setCounts] = useState({ reads: 0, listens: 0, watches: 0 })
  const [earningsTotal, setEarningsTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await (supabase.from('users') as any)
        .select('user_id').eq('auth_id', user.id).maybeSingle()
      if (profile?.user_id) setUserId(profile.user_id as number)
      setLoading(false)
    })()
  }, [supabase])

  const loadHistory = useCallback(async (uid: number) => {
    const [reads, listens, watches, earns] = await Promise.all([
      supabase.from('article_reads').select('read_id, article_id, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(40),
      supabase.from('listen_history').select('listen_id, station_id, station_name, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(40),
      supabase.from('watch_history').select('watch_id, channel_id, channel_name, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(40),
      supabase.from('earnings').select('amount').eq('user_id', uid),
    ])

    const r = (reads.data ?? []).map((x: any) => ({ id: x.read_id, kind: 'read' as const, ref_id: x.article_id, created_at: x.created_at }))
    const l = (listens.data ?? []).map((x: any) => ({ id: x.listen_id, kind: 'listen' as const, ref_id: x.station_id, name: x.station_name, created_at: x.created_at }))
    const w = (watches.data ?? []).map((x: any) => ({ id: x.watch_id, kind: 'watch' as const, ref_id: x.channel_id, name: x.channel_name, created_at: x.created_at }))

    const merged = [...r, ...l, ...w].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setRows(merged)
    setCounts({ reads: r.length, listens: l.length, watches: w.length })
    const total = (earns.data ?? []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
    setEarningsTotal(total)
  }, [supabase])

  useEffect(() => { if (userId) loadHistory(userId) }, [userId, loadHistory])

  // Live prepend when a new activity arrives
  useEffect(() => {
    if (!latestActivity || !userId) return
    const row: ActivityRow = {
      id: Date.now(),
      kind: latestActivity.kind,
      ref_id: latestActivity.ref_id,
      name: latestActivity.name,
      created_at: latestActivity.created_at,
    }
    setRows(prev => [row, ...prev].slice(0, 120))
    setCounts(prev => ({ ...prev, [latestActivity.kind === 'read' ? 'reads' : latestActivity.kind === 'listen' ? 'listens' : 'watches']: prev[latestActivity.kind === 'read' ? 'reads' : latestActivity.kind === 'listen' ? 'listens' : 'watches'] + 1 }))
  }, [latestActivity, userId])

  const ICONS = {
    read: <BookOpen size={15} />,
    listen: <Radio size={15} />,
    watch: <Tv size={15} />,
  }
  const LABELS = { read: 'Read', listen: 'Listened to', watch: 'Watched' }
  const COLORS = { read: 'var(--primary)', listen: 'var(--success)', watch: 'var(--accent)' }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
          <Loader2 className="animate-spin" size={28} />
        </main>
      </div>
    )
  }

  if (userId === null) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 text-center">
          <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Sign in to see your activity</p>
          <Link href="/login?redirect=/activity" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log in</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ActivityIcon size={26} style={{ color: 'var(--primary)' }} />
          <h1 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Activity</h1>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Articles read" value={formatNumber(counts.reads)} icon={<BookOpen size={16} />} color="var(--primary)" />
          <Stat label="Radio listens" value={formatNumber(counts.listens)} icon={<Radio size={16} />} color="var(--success)" />
          <Stat label="TV watches" value={formatNumber(counts.watches)} icon={<Tv size={16} />} color="var(--accent)" />
          <Stat label="Earnings" value={earningsTotal === null ? '—' : `KES ${formatNumber(Math.round(earningsTotal))}`} icon={<Coins size={16} />} color="var(--warning)" />
        </div>

        {/* Live feed */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Live history</h2>
          </div>
          {rows.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
              <ActivityIcon size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
              <p className="text-sm">No activity yet — read an article, play a radio station, or watch TV to start your history.</p>
            </div>
          ) : (
            <div>
              {rows.map((row) => (
                <div key={`${row.kind}-${row.id}`} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: COLORS[row.kind] }}>
                    {ICONS[row.kind]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <span style={{ fontWeight: 600 }}>{LABELS[row.kind]}</span>
                      {row.name ? ` ${row.name}` : row.kind === 'read' ? ` article #${row.ref_id}` : ` ${row.ref_id}`}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{timeAgo(row.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, marginBottom: 6 }}>{icon}</div>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{label}</p>
    </div>
  )
}
