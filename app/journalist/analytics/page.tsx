import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Analytics — Author Portal',
}

const JOURNALIST = MOCK_USERS.find(u => u.role === 'journalist')!

const WEEKLY_VIEWS = [
  { label: 'Mon', value: 420  },
  { label: 'Tue', value: 650  },
  { label: 'Wed', value: 580  },
  { label: 'Thu', value: 890  },
  { label: 'Fri', value: 1100 },
  { label: 'Sat', value: 760  },
  { label: 'Sun', value: 490  },
]

const TOP_SOURCES = [
  { label: 'Direct',       percent: 38 },
  { label: 'Google Search',percent: 29 },
  { label: 'Twitter / X',  percent: 16 },
  { label: 'Facebook',     percent: 11 },
  { label: 'Other',        percent: 6  },
]

const TOP_COUNTRIES = [
  { flag: '🇰🇪', country: 'Kenya',        percent: 34 },
  { flag: '🇳🇬', country: 'Nigeria',       percent: 22 },
  { flag: '🇿🇦', country: 'South Africa',  percent: 15 },
  { flag: '🇬🇧', country: 'United Kingdom',percent: 12 },
  { flag: '🇺🇸', country: 'United States', percent: 10 },
  { flag: '🌍', country: 'Other',          percent: 7  },
]

export default function JournalistAnalyticsPage() {
  const myArticles = MOCK_ARTICLES.filter(a => a.author_id === JOURNALIST.user_id && a.status === 'published')
  const totalViews = myArticles.reduce((s, a) => s + a.views, 0)
  const avgViews   = myArticles.length ? Math.round(totalViews / myArticles.length) : 0

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar title="Analytics" user={JOURNALIST} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Views"        value={formatNumber(totalViews)} sub="↑ +18% this month" accent="green" />
          <StatCard label="Avg Views/Article"  value={formatNumber(avgViews)}   sub="↑ +5% vs last month" accent="green" />
          <StatCard label="Total Comments"     value="347"                      sub="↑ +22% this month"   accent="green" />
          <StatCard label="Total Shares"       value="1,290"                    sub="↑ +9% this month"    accent="gold"  />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">

          {/* Weekly views chart */}
          <div className="lg:col-span-2 rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>📈 Views This Week</h2>
            <BarChart data={WEEKLY_VIEWS} />
          </div>

          {/* Traffic sources */}
          <div className="rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>🔗 Traffic Sources</h2>
            <div className="space-y-3">
              {TOP_SOURCES.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{s.percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${s.percent}%`,
                        background: 'linear-gradient(to right, var(--primary), var(--accent))',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Top articles */}
          <div className="rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
              <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>🔥 Top Performing Articles</h2>
            </div>
            <div>
              {myArticles.sort((a, b) => b.views - a.views).slice(0, 5).map((a, i) => (
                <div key={a.article_id} className="flex items-center gap-3 px-5 py-3 transition-all duration-300" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-2xl font-black min-w-[24px]" style={{ color: 'var(--primary)', opacity: 0.2 }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>👁 {formatNumber(a.views)} views</p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: 'var(--primary)' }}>{formatNumber(a.views)}</span>
                </div>
              ))}
              {myArticles.length === 0 && (
                <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>No published articles yet.</p>
              )}
            </div>
          </div>

          {/* Audience by country */}
          <div className="rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>🌍 Audience by Country</h2>
            <div className="space-y-3">
              {TOP_COUNTRIES.map(c => (
                <div key={c.country} className="flex items-center gap-3">
                  <span className="text-xl">{c.flag}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{c.country}</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{c.percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${c.percent}%`,
                          background: c.country === 'Kenya'
                            ? 'linear-gradient(to right, var(--error), #e03050)'
                            : 'linear-gradient(to right, var(--primary), var(--accent))',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
