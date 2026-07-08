import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/Badge'
import { AdminArticleActions } from '@/components/admin/AdminArticleActions'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Articles Management — Admin Panel' }
export const dynamic = 'force-dynamic'

type ArticleRow = {
  article_id: number
  title: string
  slug: string
  status: string
  monetization_type: string
  featured_image: string | null
  views: number
  created_at: string
  is_aggregated: boolean | null
  author: { name: string; profile_image: string | null } | null
  category: { name: string } | null
}

const FILTERS = ['all', 'published', 'under_review', 'draft', 'rejected'] as const
type Filter = typeof FILTERS[number]

interface Props {
  searchParams: Promise<{ filter?: string }>
}

export default async function AdminArticlesPage({ searchParams }: Props) {
  const { filter: rawFilter } = await searchParams
  const filter: Filter = (FILTERS as readonly string[]).includes(rawFilter ?? '') ? (rawFilter as Filter) : 'all'

  const supabase = await createClient()

  // Admin identity
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase
    .from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  // Fetch counts for all statuses (for tab badges)
  const [
    { count: totalCount },
    { count: publishedCount },
    { count: reviewCount },
    { count: draftCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ])

  const counts: Record<string, number> = {
    all:          totalCount ?? 0,
    published:    publishedCount ?? 0,
    under_review: reviewCount ?? 0,
    draft:        draftCount ?? 0,
    rejected:     rejectedCount ?? 0,
  }

  // Fetch articles (filtered)
  let query = supabase
    .from('articles')
    .select('article_id, title, slug, status, monetization_type, featured_image, views, created_at, is_aggregated, author:users(name,profile_image), category:categories(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filter !== 'all') query = query.eq('status', filter)

  const { data: rawArticles } = await query
  const articles = (rawArticles ?? []) as unknown as ArticleRow[]

  const stats = [
    { label: 'Total',        value: counts.all,          color: 'text-gray-800' },
    { label: 'Published',    value: counts.published,    color: 'text-emerald-600' },
    { label: 'Under Review', value: counts.under_review, color: 'text-blue-600' },
    { label: 'Draft',        value: counts.draft,        color: 'text-amber-600' },
    { label: 'Rejected',     value: counts.rejected,     color: 'text-red-500' },
  ]

  return (
    <>
      <Topbar
        title="Articles Management"
        user={{ name: admin?.name ?? 'Admin', profile_image: admin?.profile_image ?? null }}
      >
        <Link
          href="/admin/write"
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          ✏️ Write Article
        </Link>
      </Topbar>

      <div className="p-6 flex-1">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">

          {/* Filters + actions bar */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-extrabold text-gray-900">All Articles</h2>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <Link
                  key={f}
                  href={`/admin/articles${f !== 'all' ? `?filter=${f}` : ''}`}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    filter === f
                      ? 'bg-[#0a1628] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {f.replace('_', ' ')}
                  {counts[f] > 0 && (
                    <span className={`ml-1.5 ${filter === f ? 'text-white/70' : 'text-gray-400'}`}>
                      {counts[f]}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Table */}
          {articles.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="font-semibold">No articles found</p>
              <p className="text-sm mt-1">
                {filter !== 'all' ? `No ${filter.replace('_', ' ')} articles yet.` : 'Start by writing your first article.'}
              </p>
              <Link href="/admin/write" className="mt-4 inline-block text-sm font-bold text-orange-600 hover:underline">
                ✏️ Write one now →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Views</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {articles.map(a => (
                    <tr key={a.article_id} className="hover:bg-gray-50 transition-colors">

                      {/* Article */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-center gap-3">
                          {a.featured_image ? (
                            <div className="relative w-12 h-9 rounded shrink-0 overflow-hidden bg-gray-100">
                              <Image src={a.featured_image} alt={a.title} fill className="object-cover" unoptimized />
                            </div>
                          ) : (
                            <div className="w-12 h-9 rounded shrink-0 bg-gray-100 flex items-center justify-center text-lg">
                              📰
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 line-clamp-2 text-xs leading-snug">{a.title}</p>
                            {a.is_aggregated && (
                              <span className="text-[10px] bg-sky-50 text-sky-600 font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                RSS
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {a.author?.profile_image && (
                            <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                              <Image src={a.author.profile_image} alt={a.author.name} fill className="object-cover" unoptimized />
                            </div>
                          )}
                          <span className="text-gray-600 text-xs">{a.author?.name ?? '—'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-500 text-xs">{a.category?.name ?? '—'}</td>
                      <td className="px-4 py-3"><Badge status={a.status} /></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{(a.views ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(a.created_at)}</td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {a.status === 'under_review' && (
                            <Link
                              href={`/admin/review/${a.article_id}`}
                              className="text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700"
                            >
                              Review
                            </Link>
                          )}
                          <Link
                            href={`/admin/edit/${a.article_id}`}
                            className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-200"
                          >
                            Edit
                          </Link>
                          {a.status === 'published' && (
                            <Link
                              href={`/article/${a.slug}`}
                              target="_blank"
                              className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg hover:bg-emerald-100"
                            >
                              View
                            </Link>
                          )}
                          <AdminArticleActions articleId={a.article_id} currentStatus={a.status} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
