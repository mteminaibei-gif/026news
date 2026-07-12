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

  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase
    .from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

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

  let query = supabase
    .from('articles')
    .select('article_id, title, slug, status, monetization_type, featured_image, views, created_at, is_aggregated, author:users(name,profile_image), category:categories(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filter !== 'all') query = query.eq('status', filter)

  const { data: rawArticles } = await query
  const articles = (rawArticles ?? []) as unknown as ArticleRow[]

  const stats = [
    { label: 'Total',        value: counts.all,          color: 'var(--primary)' },
    { label: 'Published',    value: counts.published,    color: 'var(--primary)' },
    { label: 'Under Review', value: counts.under_review, color: 'var(--warning)' },
    { label: 'Draft',        value: counts.draft,        color: 'var(--text-tertiary)' },
    { label: 'Rejected',     value: counts.rejected,     color: 'var(--error)' },
  ]

  return (
    <>
      <Topbar
        title="Articles Management"
        user={{ name: admin?.name ?? 'Admin', profile_image: admin?.profile_image ?? null }}
      >
        <Link
          href="/admin/write"
          className="flex items-center gap-1.5 font-bold px-4 py-2 rounded-lg text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}
        >
          ✏️ Write Article
        </Link>
      </Topbar>

      <div className="p-6 flex-1" style={{ background: 'var(--bg-base)' }}>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className="backdrop-blur-sm rounded-2xl p-4 shadow-sm text-center transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>

          {/* Filters + actions bar */}
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
            <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>All Articles</h2>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <Link
                  key={f}
                  href={`/admin/articles${f !== 'all' ? `?filter=${f}` : ''}`}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300"
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    ...(filter === f
                      ? { background: 'var(--primary)', color: 'var(--text-inverse)', boxShadow: 'var(--shadow-sm)' }
                      : { background: 'var(--bg-muted)', color: 'var(--text-secondary)' })
                  }}
                >
                  {f.replace('_', ' ')}
                  {counts[f] > 0 && (
                    <span className="ml-1.5" style={{ opacity: 0.6 }}>
                      {counts[f]}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Table */}
          {articles.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--text-tertiary)' }}>
              <p className="text-3xl mb-2">📭</p>
              <p className="font-semibold">No articles found</p>
              <p className="text-sm mt-1">
                {filter !== 'all' ? `No ${filter.replace('_', ' ')} articles yet.` : 'Start by writing your first article.'}
              </p>
              <Link href="/admin/write" className="mt-4 inline-block text-sm font-bold transition-colors" style={{ color: 'var(--primary)' }}>
                ✏️ Write one now →
              </Link>
            </div>
          ) : (
            <div className="backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm min-w-max">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="px-2 md:px-4 py-3">Article</th>
                      <th className="px-2 md:px-4 py-3 hidden sm:table-cell">Author</th>
                      <th className="px-2 md:px-4 py-3 hidden md:table-cell">Category</th>
                      <th className="px-2 md:px-4 py-3 hidden lg:table-cell">Status</th>
                      <th className="px-2 md:px-4 py-3 hidden lg:table-cell">Views</th>
                      <th className="px-2 md:px-4 py-3 text-right">Date</th>
                      <th className="px-2 md:px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {articles.map(a => (
                      <tr key={a.article_id} className="transition-all duration-300" style={{ borderColor: 'var(--border-subtle)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>

                        {/* Article */}
                        <td className="px-2 md:px-4 py-3">
                          <div className="flex items-center gap-2">
                            {a.featured_image ? (
                              <div className="relative w-8 h-6 rounded shrink-0 overflow-hidden hidden sm:block" style={{ background: 'var(--bg-muted)' }}>
                                <Image src={a.featured_image} alt={a.title} fill className="object-cover" unoptimized />
                              </div>
                            ) : (
                              <div className="w-8 h-6 rounded shrink-0 flex items-center justify-center text-sm hidden sm:flex" style={{ background: 'var(--bg-muted)' }}>
                                📰
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold line-clamp-1 text-xs md:text-sm" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                              {a.is_aggregated && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                                  RSS
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="px-2 md:px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            {a.author?.profile_image && (
                              <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
                                <Image src={a.author.profile_image} alt={a.author.name} fill className="object-cover" unoptimized />
                              </div>
                            )}
                            <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{a.author?.name ?? '—'}</span>
                          </div>
                        </td>

                        <td className="px-2 md:px-4 py-3 text-xs hidden md:table-cell" style={{ color: 'var(--text-tertiary)' }}>{a.category?.name ?? '—'}</td>
                        <td className="px-2 md:px-4 py-3 hidden lg:table-cell"><Badge status={a.status} /></td>
                        <td className="px-2 md:px-4 py-3 text-xs hidden lg:table-cell" style={{ color: 'var(--text-primary)' }}>{(a.views ?? 0).toLocaleString()}</td>
                        <td className="px-2 md:px-4 py-3 text-xs whitespace-nowrap text-right" style={{ color: 'var(--text-tertiary)' }}>{formatDate(a.created_at)}</td>

                        {/* Actions */}
                        <td className="px-2 md:px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {a.status === 'under_review' && (
                              <Link
                                href={`/admin/review/${a.article_id}`}
                                className="text-xs font-bold px-2 md:px-2.5 py-1 rounded-lg transition-all duration-300 whitespace-nowrap"
                                style={{ background: 'var(--warning)', color: '#1a1a1a' }}
                              >
                                Review
                              </Link>
                            )}
                            <Link
                              href={`/admin/edit/${a.article_id}`}
                              className="text-xs font-semibold px-2 md:px-2.5 py-1 rounded-lg transition-all duration-300"
                              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                            >
                              Edit
                            </Link>
                            {a.status === 'published' && (
                              <Link
                                href={`/article/${a.slug}`}
                                target="_blank"
                                className="text-xs font-semibold px-2 md:px-2.5 py-1 rounded-lg transition-all duration-300 hidden sm:inline-block"
                                style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
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
            </div>
          )}
        </div>

      </div>
    </>
  )
}
