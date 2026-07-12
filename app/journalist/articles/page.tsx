import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/Badge'
import { MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'My Articles — Author Portal',
  description: 'Manage and track all your submitted articles on 026NEWS.',
}

const JOURNALIST = MOCK_USERS.find(u => u.role === 'journalist')!

export default function JournalistArticlesPage() {
  const articles = MOCK_ARTICLES.filter(a => a.author_id === JOURNALIST.user_id)

  const stats = [
    { label: 'Total',        count: articles.length,                                          colorStyle: { color: 'var(--primary)' } },
    { label: 'Published',    count: articles.filter(a => a.status === 'published').length,    colorStyle: { color: 'var(--primary)' } },
    { label: 'Under Review', count: articles.filter(a => a.status === 'under_review').length, colorStyle: { color: 'var(--warning)' } },
    { label: 'Drafts',       count: articles.filter(a => a.status === 'draft').length,        colorStyle: { color: 'var(--text-tertiary)' } },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar title="My Articles" user={JOURNALIST} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl p-4 shadow-sm text-center transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-3xl font-extrabold" style={s.colorStyle}>{s.count}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Header + action */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>All Articles</h2>
          <Link href="/journalist/create"
            className="font-bold px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
            + New Article
          </Link>
        </div>

        {/* Table */}
        <div className="rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
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
                {articles.map(a => (
                  <tr key={a.article_id} className="transition-all duration-300" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {a.featured_image ? (
                          <div className="relative w-12 h-9 rounded-lg overflow-hidden shrink-0">
                            <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-9 rounded-lg shrink-0 flex items-center justify-center text-sm" style={{ background: 'var(--bg-muted)' }}>📰</div>
                        )}
                        <p className="font-semibold line-clamp-2 max-w-xs" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{a.category?.name ?? '—'}</td>
                    <td className="px-4 py-3"><Badge status={a.status} /></td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {a.status === 'published' && (
                          <Link href={`/article/${a.slug}`}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300"
                            style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>
                            View
                          </Link>
                        )}
                        {(a.status === 'draft' || a.status === 'rejected') && (
                          <Link href="/journalist/create"
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300"
                            style={{ color: 'var(--warning)', background: 'var(--warning-light)' }}>
                            Edit
                          </Link>
                        )}
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
