export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { BadgePill } from '@/components/ui/BadgePill'
import { createClient } from '@/lib/supabase/server'
import { formatNumber, formatCurrency } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Author Leaderboard — 026News',
  description: 'Top-ranked authors on 026News ranked by article views and earnings.',
}

type LeaderRow = {
  user_id: number; name: string; profile_image: string | null
  bio: string | null; total_views: number; rank_score: number; badge_level: string | null
  article_count: number; total_earnings: number
  badges: { badge_type: string; badge_name: string }[]
}

const MEDAL = ['🥇', '🥈', '🥉']

export default async function LeaderboardPage() {
  let enriched: LeaderRow[] = []

  try {
    const supabase = await createClient()

    const { data: rawUsers } = await supabase
      .from('users')
      .select('user_id, name, profile_image, bio, total_views, rank_score, badge_level')
      .eq('role', 'journalist' as never)
      .eq('status', 'active' as never)
      .order('rank_score', { ascending: false })
      .limit(50)
    const users = (rawUsers ?? []) as unknown as Omit<LeaderRow, 'article_count' | 'total_earnings' | 'badges'>[]

    enriched = await Promise.all(
      users.map(async u => {
        const [{ count: artCount }, { data: earn }, { data: bdg }] = await Promise.all([
          supabase.from('articles').select('article_id', { count: 'exact', head: true })
            .eq('author_id', u.user_id).eq('status', 'published' as never),
          supabase.from('earnings').select('amount').eq('user_id', u.user_id),
          supabase.from('journalist_badges').select('badge_type, badge_name').eq('user_id', u.user_id),
        ])
        const total_earnings = (earn ?? []).reduce((s, r) => s + Number((r as { amount: number }).amount), 0)
        return {
          ...u,
          article_count:   artCount ?? 0,
          total_earnings,
          badges: (bdg ?? []) as { badge_type: string; badge_name: string }[],
        }
      })
    )
  } catch {
    // Fallback to empty list if DB queries fail
  }

  const top3 = enriched.slice(0, 3)
  const rest  = enriched.slice(3)

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Hero */}
      <section
        className="text-white py-14 px-4 text-center"
        style={{ background: 'linear-gradient(to bottom right, var(--bg-elevated), var(--primary))' }}
      >
        <h1 className="text-4xl font-extrabold mb-3" style={{ fontFamily: "'Newsreader', Georgia, serif" }}>🏆 Author Leaderboard</h1>
        <p className="max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Ranked by total views and earnings. Badges awarded automatically at milestone thresholds.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 w-full space-y-8">

        {/* Top 3 podium */}
        {top3.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4">
            {top3.map((j, i) => (
              <Link
                key={j.user_id}
                href={`/journalists/${j.user_id}`}
                className="rounded-2xl transition-all p-6 text-center relative overflow-hidden group"
                style={{
                  background: 'var(--bg-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  border: i === 0 ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                }}
              >
                <div className="text-3xl mb-3">{MEDAL[i]}</div>
                {j.profile_image ? (
                  <Image src={j.profile_image} alt={j.name} width={72} height={72} className="rounded-full object-cover mx-auto mb-3" style={{ border: '2px solid var(--border-subtle)' }} />
                ) : (
                  <div
                    className="w-18 h-18 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black"
                    style={{ width: 72, height: 72, background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
                  >
                    {j.name.charAt(0)}
                  </div>
                )}
                <p className="font-extrabold transition-colors" style={{ color: 'var(--text-primary)' }}>{j.name}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{j.article_count} articles</p>
                <p className="text-sm font-bold mt-1" style={{ color: 'var(--primary)' }}>👁 {formatNumber(j.total_views)}</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>{formatCurrency(j.total_earnings)}</p>
                {j.badges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {j.badges.slice(0, 2).map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_name} />)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Full table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>All Rankings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)' }}>
                  <th className="px-4 py-2.5 text-left w-10">#</th>
                  <th className="px-4 py-2.5 text-left">Author</th>
                  <th className="px-4 py-2.5 text-right">Views</th>
                  <th className="px-4 py-2.5 text-right">Articles</th>
                  <th className="px-4 py-2.5 text-right">Earnings</th>
                  <th className="px-4 py-2.5 text-left">Badges</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((j, i) => (
                  <tr
                    key={j.user_id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-subtle)', background: i < 3 ? 'var(--accent-light)' : 'transparent' }}
                  >
                    <td className="px-4 py-3 font-black text-base" style={{ color: 'var(--text-muted)' }}>
                      {i < 3 ? MEDAL[i] : i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/journalists/${j.user_id}`} className="flex items-center gap-2.5 transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {j.profile_image ? (
                          <Image src={j.profile_image} alt={j.name} width={32} height={32} className="rounded-full object-cover shrink-0" />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
                          >
                            {j.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold">{j.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatNumber(j.total_views)}</td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--text-tertiary)' }}>{j.article_count}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--success)' }}>{formatCurrency(j.total_earnings)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {j.badges.map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_name} />)}
                      </div>
                    </td>
                  </tr>
                ))}
                {enriched.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>No authors ranked yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Badge legend */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🏅 Badge Thresholds</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: 'bronze',   label: '🥉 Bronze',   req: '1,000 views' },
              { type: 'silver',   label: '🥈 Silver',   req: '10,000 views' },
              { type: 'gold',     label: '🥇 Gold',     req: '100,000 views' },
              { type: 'platinum', label: '💎 Platinum', req: '1,000,000 views' },
            ].map(b => (
              <div key={b.type} className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-inset)' }}>
                <BadgePill type={b.type} label={b.label} />
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{b.req}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
