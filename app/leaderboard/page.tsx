import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BadgePill } from '@/components/ui/BadgePill'
import { createClient } from '@/lib/supabase/server'
import { formatNumber, formatCurrency } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Journalist Leaderboard — 026News',
  description: 'Top-ranked journalists on 026News ranked by article views and earnings.',
}

type LeaderRow = {
  user_id: number; name: string; profile_image: string | null
  bio: string | null; total_views: number; rank_score: number; badge_level: string | null
  article_count: number; total_earnings: number
  badges: { badge_type: string; badge_label: string }[]
}

const MEDAL = ['🥇', '🥈', '🥉']

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: rawUsers } = await supabase
    .from('users')
    .select('user_id, name, profile_image, bio, total_views, rank_score, badge_level')
    .eq('role', 'journalist' as never)
    .eq('status', 'active' as never)
    .order('rank_score', { ascending: false })
    .limit(50)
  const users = (rawUsers ?? []) as unknown as Omit<LeaderRow, 'article_count' | 'total_earnings' | 'badges'>[]

  // Enrich with article count + earnings
  const enriched: LeaderRow[] = await Promise.all(
    users.map(async u => {
      const [{ count: artCount }, { data: earn }, { data: bdg }] = await Promise.all([
        supabase.from('articles').select('article_id', { count: 'exact', head: true })
          .eq('author_id', u.user_id).eq('status', 'published' as never),
        supabase.from('earnings').select('amount').eq('user_id', u.user_id),
        supabase.from('journalist_badges').select('badge_type, badge_label').eq('user_id', u.user_id),
      ])
      const total_earnings = (earn ?? []).reduce((s, r) => s + Number((r as { amount: number }).amount), 0)
      return {
        ...u,
        article_count:   artCount ?? 0,
        total_earnings,
        badges: (bdg ?? []) as { badge_type: string; badge_label: string }[],
      }
    })
  )

  const top3 = enriched.slice(0, 3)
  const rest  = enriched.slice(3)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] text-white py-14 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-3">🏆 Journalist Leaderboard</h1>
        <p className="text-white/60 max-w-xl mx-auto">
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
                className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-6 text-center relative overflow-hidden group ${i === 0 ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <div className="text-3xl mb-3">{MEDAL[i]}</div>
                {j.profile_image ? (
                  <Image src={j.profile_image} alt={j.name} width={72} height={72} className="rounded-full object-cover mx-auto mb-3 ring-2 ring-gray-100" />
                ) : (
                  <div className="w-18 h-18 rounded-full bg-gray-200 mx-auto mb-3 flex items-center justify-center text-2xl font-black text-gray-500" style={{ width: 72, height: 72 }}>
                    {j.name.charAt(0)}
                  </div>
                )}
                <p className="font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">{j.name}</p>
                <p className="text-xs text-gray-400 mt-1">{j.article_count} articles</p>
                <p className="text-sm font-bold text-blue-600 mt-1">👁 {formatNumber(j.total_views)}</p>
                <p className="text-xs text-emerald-600 font-semibold">{formatCurrency(j.total_earnings)}</p>
                {j.badges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {j.badges.slice(0, 2).map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_label} />)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Full table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">All Rankings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left w-10">#</th>
                  <th className="px-4 py-2.5 text-left">Journalist</th>
                  <th className="px-4 py-2.5 text-right">Views</th>
                  <th className="px-4 py-2.5 text-right">Articles</th>
                  <th className="px-4 py-2.5 text-right">Earnings</th>
                  <th className="px-4 py-2.5 text-left">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {enriched.map((j, i) => (
                  <tr key={j.user_id} className={`hover:bg-gray-50 transition-colors ${i < 3 ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-4 py-3 font-black text-gray-300 text-base">
                      {i < 3 ? MEDAL[i] : i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/journalists/${j.user_id}`} className="flex items-center gap-2.5 hover:text-blue-600 transition-colors">
                        {j.profile_image ? (
                          <Image src={j.profile_image} alt={j.name} width={32} height={32} className="rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                            {j.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-gray-900">{j.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">{formatNumber(j.total_views)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{j.article_count}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(j.total_earnings)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {j.badges.map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_label} />)}
                      </div>
                    </td>
                  </tr>
                ))}
                {enriched.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No journalists ranked yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Badge legend */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">🏅 Badge Thresholds</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: 'bronze',   label: '🥉 Bronze',   req: '1,000 views' },
              { type: 'silver',   label: '🥈 Silver',   req: '10,000 views' },
              { type: 'gold',     label: '🥇 Gold',     req: '100,000 views' },
              { type: 'platinum', label: '💎 Platinum', req: '1,000,000 views' },
            ].map(b => (
              <div key={b.type} className="text-center p-3 rounded-lg bg-gray-50">
                <BadgePill type={b.type} label={b.label} />
                <p className="text-xs text-gray-400 mt-1.5">{b.req}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
      <Footer />
    </div>
  )
}
