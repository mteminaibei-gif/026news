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
    { label: 'Total',        count: articles.length,                                          color: 'text-[#1a5c2a]' },
    { label: 'Published',    count: articles.filter(a => a.status === 'published').length,    color: 'text-[#1a5c2a]' },
    { label: 'Under Review', count: articles.filter(a => a.status === 'under_review').length, color: 'text-[#f5c518]' },
    { label: 'Drafts',       count: articles.filter(a => a.status === 'draft').length,        color: 'text-gray-500' },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar title="My Articles" user={JOURNALIST} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl p-4 shadow-sm text-center transition-all duration-300 hover:shadow-md">
              <div className={`text-3xl font-extrabold ${s.color}`}>{s.count}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Header + action */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-[#1a5c2a]">All Articles</h2>
          <Link href="/journalist/create"
            className="bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            + New Article
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Article</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Views</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0faf2]">
                {articles.map(a => (
                  <tr key={a.article_id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {a.featured_image ? (
                          <div className="relative w-12 h-9 rounded-lg overflow-hidden shrink-0">
                            <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-9 rounded-lg bg-[#f0faf2] shrink-0 flex items-center justify-center text-sm">📰</div>
                        )}
                        <p className="font-semibold text-gray-800 line-clamp-2 max-w-xs">{a.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.category?.name ?? '—'}</td>
                    <td className="px-4 py-3"><Badge status={a.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{a.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {a.status === 'published' && (
                          <Link href={`/article/${a.slug}`}
                            className="text-xs font-semibold text-[#1a5c2a] bg-[#e8f5ea] hover:bg-[#d1ead3] px-2.5 py-1 rounded-lg transition-all duration-300">
                            View
                          </Link>
                        )}
                        {(a.status === 'draft' || a.status === 'rejected') && (
                          <Link href="/journalist/create"
                            className="text-xs font-semibold text-[#f5c518] bg-[#fff8e1] hover:bg-[#fef0b2] px-2.5 py-1 rounded-lg transition-all duration-300">
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
