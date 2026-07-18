'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Sparkles, MoreHorizontal, Eye, Pencil, Trash2, Star, StarOff } from 'lucide-react'

import { AdminArticleActions } from '@/components/admin/AdminArticleActions'
import { AdminArticleEditTags } from '@/components/admin/AdminArticleEditTags'
import { ArticleSEOPanel } from '@/components/admin/ArticleSEOPanel'
import { formatDate } from '@/lib/utils'

type ArticleRow = {
  article_id: number; title: string; slug: string; status: string
  monetization_type: string; featured_image: string | null; views: number
  created_at: string; is_aggregated: boolean | null; tags: string[] | null
  category_id: number | null
  author: { name: string; profile_image: string | null } | null
  category: { name: string; category_id: number } | null
}

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  published:    { bg: 'var(--success-light)', fg: 'var(--success)', label: 'Live' },
  under_review: { bg: 'var(--warning-light)', fg: 'var(--warning)', label: 'Review' },
  draft:        { bg: 'var(--bg-muted)', fg: 'var(--text-tertiary)', label: 'Draft' },
  rejected:     { bg: 'var(--error-light)', fg: 'var(--error)', label: 'Rejected' },
}

export function AdminArticlesTable({ articles }: { articles: ArticleRow[] }) {
  const router = useRouter()
  const [seoFor, setSeoFor] = useState<{ article_id: number; title: string; slug: string; status: string } | null>(null)
  const [openMenu, setOpenMenu] = useState<number | null>(null)

  if (articles.length === 0) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
        <p className="text-3xl mb-2">No articles found</p>
        <p className="text-sm mt-1">Try changing the filters, or write your first article.</p>
        <Link href="/admin/write" className="mt-4 inline-block text-sm font-bold" style={{ color: 'var(--primary)' }}>Write one now →</Link>
      </div>
    )
  }

  const toggle = (id: number) => setOpenMenu(prev => prev === id ? null : id)

  return (
    <>
      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        {articles.map(a => {
          const st = STATUS_STYLES[a.status] || STATUS_STYLES.draft
          return (
            <div
              key={a.article_id}
              className="px-4 md:px-6 py-3 flex items-center gap-3 transition-colors relative"
              style={{ borderBottom: '1px solid var(--border-subtle, #e5e7eb)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted, #f9fafb)'}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; if (openMenu === a.article_id) setOpenMenu(null) }}
            >
              {/* Thumbnail */}
              {a.featured_image ? (
                <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 hidden sm:block">
                  <Image src={a.featured_image} alt="" fill className="object-cover" unoptimized  sizes="(max-width: 640px) 100vw, 50vw" loading="lazy"/>
                </div>
              ) : (
                <div className="w-14 h-10 rounded-lg shrink-0 hidden sm:flex items-center justify-center text-base" style={{ background: 'var(--bg-muted, #f3f4f6)' }}>📰</div>
              )}

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                  {a.is_aggregated && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded hidden sm:inline" style={{ background: 'var(--info)', color: 'var(--text-inverse)' }}>RSS</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                  {a.category?.name && <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{a.category.name}</span>}
                  <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>·</span>
                  <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>{a.author?.name ?? '—'}</span>
                  <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>·</span>
                  <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>{(a.views ?? 0).toLocaleString()} views</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>· {formatDate(a.created_at)}</span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-1 shrink-0">
                 {a.status === 'under_review' && (
                  <Link href={`/admin/review/${a.article_id}`} className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>Review</Link>
                )}
                <button
                  onClick={() => setSeoFor({ article_id: a.article_id, title: a.title, slug: a.slug, status: a.status })}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background: 'var(--primary-light, #eef2ff)', color: 'var(--primary)' }}
                  title="SEO Analysis"
                ><Sparkles size={14} /></button>
                <Link href={`/admin/edit/${a.article_id}`} className="p-1.5 rounded-lg transition-colors" style={{ background: 'var(--bg-muted, #f3f4f6)', color: 'var(--text-secondary)' }} title="Edit">
                  <Pencil size={14} />
                </Link>
                {a.status === 'published' && (
                  <Link href={`/article/${a.slug}`} target="_blank" className="p-1.5 rounded-lg transition-colors hidden sm:flex" style={{ background: 'var(--bg-muted, #f3f4f6)', color: 'var(--text-secondary)' }} title="View">
                    <Eye size={14} />
                  </Link>
                )}
                {/* More menu */}
                <div className="relative">
                  <button onClick={() => toggle(a.article_id)} className="p-1.5 rounded-lg transition-colors" style={{ background: openMenu === a.article_id ? 'var(--bg-muted)' : 'transparent', color: 'var(--text-tertiary)' }}>
                    <MoreHorizontal size={14} />
                  </button>
                   {openMenu === a.article_id && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl py-1 z-50" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      <AdminArticleActions articleId={a.article_id} currentStatus={a.status} />
                      {a.is_aggregated && (
                        <div className="px-3 py-1.5">
                          <AdminArticleEditTags articleId={a.article_id} currentTags={a.tags ?? []} currentCategoryId={a.category_id} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {seoFor && (
        <ArticleSEOPanel article={seoFor} onClose={() => setSeoFor(null)} onApplied={() => { setSeoFor(null); router.refresh() }} />
      )}
    </>
  )
}
