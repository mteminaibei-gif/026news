import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminArticlesTable } from '@/components/admin/AdminArticlesTable'

export const metadata: Metadata = { title: 'Articles — Admin' }
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
  featured: boolean | null
  pinned: boolean | null
  author: { name: string; profile_image: string | null } | null
  category: { name: string; category_id: number } | null
}

const STATUSFilters = ['all', 'published', 'under_review', 'draft', 'rejected'] as const

interface Props {
  searchParams: Promise<{ filter?: string; source?: string; q?: string; priority?: string }>
}

export default async function AdminArticlesPage({ searchParams }: Props) {
  const { filter: rawFilter, source: rawSource, q: rawQ, priority: rawPriority } = await searchParams
  const filter = STATUSFilters.includes(rawFilter as any) ? rawFilter! : 'all'
  const source = rawSource === 'rss' ? 'rss' : rawSource === 'inhouse' ? 'inhouse' : 'all'
  const searchQuery = rawQ || ''
  const showPriority = rawPriority === '1'

  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    return <div className="p-6 flex-1" style={{ background: 'var(--bg-base)' }}><p className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>Unable to connect. Try refreshing.</p></div>
  }

  // Single query for counts using a raw count approach
  const safeCount = async (eqs: { col: string; val: string | boolean }[] = []) => {
    try {
      let q = supabase.from('articles').select('article_id', { count: 'exact', head: true })
      for (const e of eqs) q = q.eq(e.col, e.val as never)
      const { count } = await q
      return count ?? 0
    } catch { return 0 }
  }

  const [totalCount, publishedCount, reviewCount, draftCount] = await Promise.all([
    safeCount(),
    safeCount([{ col: 'status', val: 'published' }]),
    safeCount([{ col: 'status', val: 'under_review' }]),
    safeCount([{ col: 'status', val: 'draft' }]),
  ])

  let articles: ArticleRow[] = []
  try {
    let q = supabase
      .from('articles')
      .select('article_id, title, slug, status, monetization_type, featured_image, views, created_at, is_aggregated, tags, category_id, featured, pinned, author:users(name,profile_image), category:categories(name,category_id)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (filter !== 'all') q = q.eq('status', filter)
    if (source === 'inhouse') q = q.eq('is_aggregated', false)
    if (source === 'rss') q = q.eq('is_aggregated', true)
    if (searchQuery) {
      const escaped = searchQuery.replace(/%/g, '\\%').replace(/_/g, '\\_')
      q = q.ilike('title', `%${escaped}%`)
    }
    if (showPriority) q = q.eq('pinned', true)
    const { data } = await q
    articles = (data ?? []) as unknown as ArticleRow[]
  } catch { articles = [] }

  const buildHref = (f: string, s: string, p?: string, qs?: string) => {
    const sp = new URLSearchParams()
    if (f !== 'all') sp.set('filter', f)
    if (s !== 'all') sp.set('source', s)
    if (p === '1') sp.set('priority', '1')
    if (qs) sp.set('q', qs)
    const qstr = sp.toString()
    return `/admin/articles${qstr ? `?${qstr}` : ''}`
  }

  return (
    <div className="flex-1" style={{ background: 'var(--bg-base)' }}>
      {/* Compact header bar */}
      <div className="px-4 md:px-6 py-3 flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid var(--border-subtle, #e5e7eb)', background: 'var(--bg-surface, #fff)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-lg font-extrabold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Articles</h1>
          {/* Inline stat pills */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {[
              { label: 'All', value: totalCount, f: 'all', active: filter === 'all' },
              { label: 'Live', value: publishedCount, f: 'published', active: filter === 'published' },
              { label: 'Review', value: reviewCount, f: 'under_review', active: filter === 'under_review' },
              { label: 'Draft', value: draftCount, f: 'draft', active: filter === 'draft' },
            ].map(s => (
              <Link key={s.f} href={buildHref(s.f, source)} className="px-2.5 py-1 rounded-full font-semibold transition-all" style={{
                background: s.active ? 'var(--primary)' : 'var(--bg-muted, #f3f4f6)',
                color: s.active ? '#fff' : 'var(--text-secondary, #6b7280)',
              }}>
                {s.label} <span className="opacity-60">{s.value}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <form method="GET" action="/admin/articles" className="relative hidden sm:block">
            <input name="q" defaultValue={searchQuery} placeholder="Search articles..."
              className="w-40 lg:w-56 text-xs rounded-lg pl-8 pr-2.5 py-1.5 outline-none transition-all"
              style={{ background: 'var(--bg-muted, #f3f4f6)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, #e5e7eb)' }}
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            {searchQuery && <Link href={buildHref(filter, source, showPriority ? '1' : undefined)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>✕</Link>}
          </form>
          {/* Priority toggle */}
          <Link href={buildHref(filter, source, showPriority ? undefined : '1', searchQuery || undefined)}
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
            style={{ background: showPriority ? 'var(--primary)' : 'var(--bg-muted, #f3f4f6)', color: showPriority ? '#fff' : 'var(--text-secondary, #6b7280)' }}
          >
            ⭐ Priority
          </Link>
          {/* Source toggle */}
          <div className="flex rounded-lg overflow-hidden text-xs font-semibold" style={{ border: '1px solid var(--border-subtle, #e5e7eb)' }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'inhouse', label: 'Staff' },
              { key: 'rss', label: 'RSS' },
            ].map(s => (
              <Link key={s.key} href={buildHref(filter, s.key)} className="px-3 py-1.5 transition-all" style={{
                background: source === s.key ? 'var(--primary)' : 'transparent',
                color: source === s.key ? '#fff' : 'var(--text-secondary, #6b7280)',
              }}>{s.label}</Link>
            ))}
          </div>
          <Link href="/admin/write" className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap" style={{ background: 'var(--primary)', color: '#fff' }}>
            + Write
          </Link>
        </div>
      </div>

      {/* Mobile stat pills */}
      <div className="sm:hidden px-4 py-2 flex items-center gap-1.5 text-xs overflow-x-auto" style={{ borderBottom: '1px solid var(--border-subtle, #e5e7eb)' }}>
        {[
          { label: 'All', value: totalCount, f: 'all' },
          { label: 'Live', value: publishedCount, f: 'published' },
          { label: 'Review', value: reviewCount, f: 'under_review' },
          { label: 'Draft', value: draftCount, f: 'draft' },
        ].map(s => (
          <Link key={s.f} href={buildHref(s.f, source)} className="px-2.5 py-1 rounded-full font-semibold whitespace-nowrap" style={{
            background: filter === s.f ? 'var(--primary)' : 'var(--bg-muted, #f3f4f6)',
            color: filter === s.f ? '#fff' : 'var(--text-secondary, #6b7280)',
          }}>
            {s.label} <span className="opacity-60">{s.value}</span>
          </Link>
        ))}
      </div>

      {/* Table */}
      <AdminArticlesTable articles={articles} />
    </div>
  )
}
