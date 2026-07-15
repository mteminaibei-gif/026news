import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { Badge } from '@/components/ui/Badge'
import { AdminArticleActions } from '@/components/admin/AdminArticleActions'
import { AdminArticleEditTags } from '@/components/admin/AdminArticleEditTags'
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
  tags: string[] | null
  category_id: number | null
  author: { name: string; profile_image: string | null } | null
  category: { name: string; category_id: number } | null
}

const STATUS_FILTERS = ['all', 'published', 'under_review', 'draft', 'rejected'] as const
type StatusFilter = typeof STATUS_FILTERS[number]
const SOURCE_FILTERS = ['all', 'inhouse', 'rss'] as const
type SourceFilter = typeof SOURCE_FILTERS[number]

interface Props {
  searchParams: Promise<{ filter?: string; source?: string }>
}

export default async function AdminArticlesPage({ searchParams }: Props) {
  const { filter: rawFilter, source: rawSource } = await searchParams
  const filter: StatusFilter = (STATUS_FILTERS as readonly string[]).includes(rawFilter ?? '') ? (rawFilter as StatusFilter) : 'all'
  const source: SourceFilter = (SOURCE_FILTERS as readonly string[]).includes(rawSource ?? '') ? (rawSource as SourceFilter) : 'all'

  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    return (
      <div className="p-6 flex-1" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center py-16" style={{ color: 'var(--text-tertiary)' }}>
          <p className="text-lg font-semibold mb-2">Unable to connect to database</p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase
    .from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  const safeCount = async (eqs: { col: string; val: string | boolean }[] = []) => {
    try {
      let q = supabase.from('articles').select('article_id', { count: 'exact', head: true })
      for (const e of eqs) q = q.eq(e.col, e.val as never)
      const { count } = await q
      return count ?? 0
    } catch {
      return 0
    }
  }

  const [totalCount, publishedCount, reviewCount, draftCount, rejectedCount, inhouseCount, rssCount] = await Promise.all([
    safeCount(),
    safeCount([{ col: 'status', val: 'published' }]),
    safeCount([{ col: 'status', val: 'under_review' }]),
    safeCount([{ col: 'status', val: 'draft' }]),
    safeCount([{ col: 'status', val: 'rejected' }]),
    safeCount([{ col: 'is_aggregated', val: false }]),
    safeCount([{ col: 'is_aggregated', val: true }]),
  ])

  const statusCounts: Record<string, number> = {
    all: totalCount, published: publishedCount, under_review: reviewCount,
    draft: draftCount, rejected: rejectedCount,
  }

  let articles: ArticleRow[] = []
  try {
    let query = supabase
      .from('articles')
      .select('article_id, title, slug, status, monetization_type, featured_image, views, created_at, is_aggregated, tags, category_id, author:users(name,profile_image), category:categories(name,category_id)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (filter !== 'all') query = query.eq('status', filter)
    if (source === 'inhouse') query = query.eq('is_aggregated', false)
    if (source === 'rss') query = query.eq('is_aggregated', true)

    const { data: rawArticles } = await query
    articles = (rawArticles ?? []) as unknown as ArticleRow[]
  } catch {
    articles = []
  }

  const buildHref = (s: StatusFilter, src: SourceFilter) => {
    const params = new URLSearchParams()
    if (s !== 'all') params.set('filter', s)
    if (src !== 'all') params.set('source', src)
    const qs = params.toString()
    return `/admin/articles${qs ? `?${qs}` : ''}`
  }

  const stats = [
    { label: 'Total', value: totalCount, color: 'var(--primary)' },
    { label: 'Published', value: publishedCount, color: 'var(--primary)' },
    { label: 'In Review', value: reviewCount, color: 'var(--warning)' },
    { label: 'Drafts', value: draftCount, color: 'var(--text-tertiary)' },
    { label: 'Rejected', value: rejectedCount, color: 'var(--error)' },
  ]

  return (
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

          {/* Source tabs */}
          <div className="px-5 py-3 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
            <h2 className="font-extrabold text-sm" style={{ color: 'var(--primary)' }}>Articles</h2>
            <div className="flex gap-2 ml-4">
              {([
                { key: 'all' as SourceFilter, label: 'All', count: totalCount },
                { key: 'inhouse' as SourceFilter, label: 'In-House', count: inhouseCount },
                { key: 'rss' as SourceFilter, label: 'RSS / Pulled', count: rssCount },
              ]).map(s => (
                <Link
                  key={s.key}
                  href={buildHref(filter, s.key)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200"
                  style={{
                    ...(source === s.key
                      ? { background: 'var(--primary)', color: 'var(--text-inverse)' }
                      : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' })
                  }}
                >
                  {s.label}
                  <span className="ml-1 opacity-60">{s.count}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Status filters */}
          <div className="px-5 py-3 flex flex-wrap items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {STATUS_FILTERS.map(f => (
              <Link
                key={f}
                href={buildHref(f, source)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  ...(filter === f
                    ? { background: 'var(--primary)', color: 'var(--text-inverse)' }
                    : { background: 'var(--bg-muted)', color: 'var(--text-secondary)' })
                }}
              >
                {f.replace('_', ' ')}
                {statusCounts[f] > 0 && <span className="ml-1 opacity-60">{statusCounts[f]}</span>}
              </Link>
            ))}
          </div>

          {/* Scrollable article list */}
          {articles.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--text-tertiary)' }}>
              <p className="text-3xl mb-2">No articles found</p>
              <p className="text-sm mt-1">
                {filter !== 'all' || source !== 'all' ? 'Try changing the filters.' : 'Start by writing your first article.'}
              </p>
              <Link href="/admin/write" className="mt-4 inline-block text-sm font-bold transition-colors" style={{ color: 'var(--primary)' }}>
                Write one now →
              </Link>
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
              <table className="w-full text-xs md:text-sm min-w-max">
                <thead className="sticky top-0 z-10">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Author</th>
                    <th className="px-4 py-3 hidden md:table-cell">Category</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Status</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Views</th>
                    <th className="px-4 py-3 text-right">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {articles.map(a => (
                    <tr key={a.article_id} className="transition-colors hover:[background:var(--bg-muted)]" style={{ borderColor: 'var(--border-subtle)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {a.featured_image ? (
                            <div className="relative w-10 h-8 rounded shrink-0 overflow-hidden hidden sm:block" style={{ background: 'var(--bg-muted)' }}>
                              <Image src={a.featured_image} alt={a.title} fill className="object-cover" unoptimized />
                            </div>
                          ) : (
                            <div className="w-10 h-8 rounded shrink-0 flex items-center justify-center text-sm hidden sm:flex" style={{ background: 'var(--bg-muted)' }}>
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

                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          {a.author?.profile_image && (
                            <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
                              <Image src={a.author.profile_image} alt={a.author.name} fill className="object-cover" unoptimized />
                            </div>
                          )}
                          <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{a.author?.name ?? '—'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: 'var(--text-tertiary)' }}>{a.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Badge status={a.status} /></td>
                      <td className="px-4 py-3 text-xs hidden lg:table-cell" style={{ color: 'var(--text-primary)' }}>{(a.views ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-right" style={{ color: 'var(--text-tertiary)' }}>{formatDate(a.created_at)}</td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {a.status === 'under_review' && (
                            <Link
                              href={`/admin/review/${a.article_id}`}
                              className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all duration-200"
                              style={{ background: 'var(--warning)', color: '#1a1a1a' }}
                            >
                              Review
                            </Link>
                          )}
                          <Link
                            href={`/admin/edit/${a.article_id}`}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-200"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                          >
                            Edit
                          </Link>
                          {a.status === 'published' && (
                            <Link
                              href={`/article/${a.slug}`}
                              target="_blank"
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-200 hidden sm:inline-block"
                              style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                            >
                              View
                            </Link>
                          )}
                          {a.is_aggregated && (
                            <AdminArticleEditTags
                              articleId={a.article_id}
                              currentTags={a.tags ?? []}
                              currentCategoryId={a.category_id}
                            />
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
  )
}
