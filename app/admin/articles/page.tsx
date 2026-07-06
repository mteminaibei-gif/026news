import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/Badge'
import { MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Articles Management — Admin Panel',
}

const ADMIN = MOCK_USERS.find(u => u.role === 'admin')!

export default function AdminArticlesPage() {
  const stats = [
    { label: 'Total', value: MOCK_ARTICLES.length, color: 'text-gray-800' },
    { label: 'Published', value: MOCK_ARTICLES.filter(a => a.status === 'published').length, color: 'text-green-600' },
    { label: 'Under Review', value: MOCK_ARTICLES.filter(a => a.status === 'under_review').length, color: 'text-yellow-600' },
    { label: 'Rejected', value: MOCK_ARTICLES.filter(a => a.status === 'rejected').length, color: 'text-red-500' },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="Articles Management" user={ADMIN} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900">All Articles</h2>
            <div className="flex gap-2">
              {['all', 'published', 'under_review', 'draft', 'rejected'].map(filter => (
                <span
                  key={filter}
                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                    filter === 'all' ? 'bg-[#0a1628] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500">Article</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Author</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Views</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ARTICLES.map(a => {
                  const author = MOCK_USERS.find(u => u.user_id === a.author_id)
                  return (
                    <tr key={a.article_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 max-w-xs">
                          {a.featured_image && (
                            <div className="relative w-12 h-9 rounded shrink-0 overflow-hidden">
                              <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                            </div>
                          )}
                          <p className="font-semibold text-gray-800 line-clamp-2">{a.title}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{author?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{a.category?.name ?? '—'}</td>
                      <td className="px-4 py-3"><Badge status={a.status} /></td>
                      <td className="px-4 py-3 text-gray-600">{a.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {a.status === 'under_review' && (
                            <Link href={`/admin/review/${a.article_id}`} className="text-xs font-bold text-orange-600 hover:underline">
                              Review
                            </Link>
                          )}
                          {a.status === 'published' && (
                            <Link href={`/article/${a.slug}`} className="text-xs font-medium text-blue-600 hover:underline">
                              View
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
