import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/Badge'
import { MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'My Articles — Journalist Portal',
  description: 'Manage and track all your submitted articles on 026News.',
}

const JOURNALIST = MOCK_USERS.find(u => u.role === 'journalist')!

export default function JournalistArticlesPage() {
  const articles = MOCK_ARTICLES.filter(a => a.author_id === JOURNALIST.user_id)

  const stats = [
    { label: 'Total', count: articles.length, color: 'text-gray-700' },
    { label: 'Published', count: articles.filter(a => a.status === 'published').length, color: 'text-green-600' },
    { label: 'Under Review', count: articles.filter(a => a.status === 'under_review').length, color: 'text-yellow-600' },
    { label: 'Drafts', count: articles.filter(a => a.status === 'draft').length, color: 'text-gray-400' },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="My Articles" user={JOURNALIST} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className={`text-3xl font-extrabold ${s.color}`}>{s.count}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-900">All Articles</h2>
          <Link
            href="/journalist/create"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + New Article
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500">Article</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Views</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(a => (
                  <tr key={a.article_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {a.featured_image && (
                          <div className="relative w-12 h-9 rounded overflow-hidden shrink-0">
                            <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                          </div>
                        )}
                        <p className="font-semibold text-gray-800 line-clamp-2 max-w-xs">{a.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.category?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {a.status === 'published' && (
                          <Link
                            href={`/article/${a.slug}`}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            View
                          </Link>
                        )}
                        {(a.status === 'draft' || a.status === 'rejected') && (
                          <Link
                            href={`/journalist/create`}
                            className="text-xs font-medium text-orange-500 hover:underline"
                          >
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
