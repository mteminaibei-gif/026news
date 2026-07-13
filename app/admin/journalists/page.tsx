import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { PostgrestResponse } from '@supabase/supabase-js'

export const metadata: Metadata = {
  title: 'Authors Management — Admin Panel',
}

type JournalistRow = {
  user_id: number
  name: string
  email: string
  profile_image: string | null
  bio: string | null
  status: string
  created_at: string
  article_count: number
  subscriber_count: number
  total_earnings: number
}

export default async function AdminJournalistsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase
    .from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  const { data: rawJournalists } = await supabase
    .from('users')
    .select('user_id, name, email, profile_image, bio, status, created_at')
    .eq('role', 'journalist' as never)
    .order('created_at', { ascending: false }) as PostgrestResponse<Record<string, unknown>>

  const journalists = (rawJournalists ?? []) as unknown as { user_id: number; name: string; email: string; profile_image: string | null; bio: string | null; status: string; created_at: string }[]

  // Fetch article counts per journalist
  const journalistIds = journalists.map(j => j.user_id)
  const { data: articleCounts } = await supabase
    .from('articles')
    .select('author_id')
    .in('author_id', journalistIds as never)
    .eq('status', 'published' as never) as { data: { author_id: number }[] | null }

  const countMap: Record<number, number> = {}
  for (const row of (articleCounts ?? [])) {
    countMap[row.author_id] = (countMap[row.author_id] ?? 0) + 1
  }

  // Fetch earnings per journalist
  const { data: earnData } = await supabase
    .from('earnings')
    .select('user_id, amount') as { data: { user_id: number; amount: number }[] | null }

  const earnMap: Record<number, number> = {}
  for (const row of (earnData ?? [])) {
    earnMap[row.user_id] = (earnMap[row.user_id] ?? 0) + Number(row.amount)
  }

  // Fetch subscriber counts from journalists table
  const { data: journalistProfiles } = await supabase
    .from('journalists')
    .select('user_id, subscribers') as { data: { user_id: number; subscribers: number }[] | null }

  const subMap: Record<number, number> = {}
  for (const row of (journalistProfiles ?? [])) {
    subMap[row.user_id] = row.subscribers ?? 0
  }

  const enriched: JournalistRow[] = journalists.map(j => ({
    ...j,
    article_count: countMap[j.user_id] ?? 0,
    subscriber_count: subMap[j.user_id] ?? 0,
    total_earnings: earnMap[j.user_id] ?? 0,
  }))

  const totalArticles = enriched.reduce((s, j) => s + j.article_count, 0)
  const totalEarnings = enriched.reduce((s, j) => s + j.total_earnings, 0)
  const activeCount = enriched.filter(j => j.status === 'active').length

  const stats = [
    { label: 'Total Authors',  value: enriched.length,              color: 'var(--primary)' },
    { label: 'Active',         value: activeCount,                  color: 'var(--success)' },
    { label: 'Total Articles', value: totalArticles,                color: 'var(--primary)' },
    { label: 'Earnings Paid',  value: `$${totalEarnings.toFixed(2)}`, color: 'var(--warning)' },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Topbar title="Authors Management" user={{ name: admin?.name ?? 'Admin', profile_image: admin?.profile_image ?? null }} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="backdrop-blur-sm rounded-2xl p-4 shadow-sm text-center transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
            <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>All Authors</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                  <th className="px-4 py-3 text-left">Author</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Articles</th>
                  <th className="px-4 py-3 text-left">Subscribers</th>
                  <th className="px-4 py-3 text-left">Earnings</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {enriched.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                      <p className="text-lg mb-1">No authors yet</p>
                      <p className="text-sm">Authors will appear here once they sign up.</p>
                    </td>
                  </tr>
                ) : enriched.map(j => (
                  <tr key={j.user_id} className="transition-all duration-300" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {j.profile_image ? (
                          <Image src={j.profile_image} alt={j.name} width={32} height={32} className="rounded-full object-cover shrink-0" style={{ boxShadow: '0 0 0 2px var(--border-subtle)' }} unoptimized />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            {j.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{j.name}</p>
                          <p className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-tertiary)' }}>{j.bio?.substring(0, 40) || 'No bio'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{j.email}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: 'var(--primary)' }}>{j.article_count}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{j.subscriber_count.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: 'var(--primary)' }}>${j.total_earnings.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        ...(j.status === 'active' ? { background: 'var(--success-light)', color: 'var(--success)' } :
                          j.status === 'banned' ? { background: 'var(--error-light)', color: 'var(--error)' } :
                          { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' })
                      }}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(j.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/journalists/${j.user_id}`} className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
