import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Analytics — Author Portal',
}

export default async function JournalistAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('users').select('user_id, name, profile_image, role').eq('email', user.email ?? '').single()
  const profile = rawProfile as unknown as { user_id: number; name: string; profile_image: string | null; role: string } | null
  if (!profile) redirect('/login')

  // Fetch journalist's articles
  const { data: articles } = await supabase
    .from('articles')
    .select('article_id, title, views, likes, earnings, created_at, status')
    .eq('author_id', profile.user_id)
    .order('created_at', { ascending: false })

  const allArticles = (articles ?? []) as unknown as { article_id: number; title: string; views: number; likes: number; earnings: number; created_at: string; status: string }[]
  const published = allArticles.filter(a => a.status === 'published')
  const drafts = allArticles.filter(a => a.status === 'draft')
  const underReview = allArticles.filter(a => a.status === 'under_review')

  const totalViews = published.reduce((s, a) => s + (a.views ?? 0), 0)
  const avgViews = published.length ? Math.round(totalViews / published.length) : 0
  const totalEarnings = published.reduce((s, a) => s + Number(a.earnings ?? 0), 0)

  // Monthly views chart (last 6 months)
  const viewsData: number[] = []
  const viewsLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    viewsLabels.push(d.toLocaleString('default', { month: 'short' }))
    viewsData.push(published.filter(a => a.created_at?.startsWith(ym)).reduce((s, a) => s + (a.views ?? 0), 0))
  }

  // Top articles by views
  const topArticles = [...published].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 10)

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Views" value={formatNumber(totalViews)} sub={`${published.length} published articles`} accent="green" />
          <StatCard label="Avg Views/Article" value={formatNumber(avgViews)} sub={`across ${published.length} articles`} accent="green" />
          <StatCard label="Total Earnings" value={`KES ${totalEarnings.toLocaleString()}`} sub={`${drafts.length} drafts, ${underReview.length} in review`} accent="gold" />
          <StatCard label="Published" value={String(published.length)} sub={`${underReview.length} pending review`} accent="green" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">

          {/* Views chart */}
          <div className="lg:col-span-2 rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>📈 Views (Last 6 Months)</h2>
            <BarChart data={viewsData.length ? viewsData : [0, 0, 0, 0, 0, 0]} labels={viewsLabels.length ? viewsLabels : ['Jan','Feb','Mar','Apr','May','Jun']} />
          </div>

          {/* Top articles */}
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

        {/* All articles table */}
        <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>📋 All Articles</h2>
          </div>
          {allArticles.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No articles yet</div>
          ) : (
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
                  {allArticles.map(a => (
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
          )}
        </div>
      </main>
    </div>
  )
}
