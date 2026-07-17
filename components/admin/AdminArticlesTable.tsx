'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { AdminArticleActions } from '@/components/admin/AdminArticleActions'
import { AdminArticleEditTags } from '@/components/admin/AdminArticleEditTags'
import { ArticleSEOPanel } from '@/components/admin/ArticleSEOPanel'
import { formatDate } from '@/lib/utils'

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

export function AdminArticlesTable({ articles }: { articles: ArticleRow[] }) {
  const [seoFor, setSeoFor] = useState<{ article_id: number; title: string; slug: string; status: string } | null>(null)

  if (articles.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-tertiary)' }}>
        <p className="text-3xl mb-2">No articles found</p>
        <p className="text-sm mt-1">Try changing the filters, or write your first article.</p>
        <Link href="/admin/write" className="mt-4 inline-block text-sm font-bold transition-colors" style={{ color: 'var(--primary)' }}>
          Write one now →
        </Link>
      </div>
    )
  }

  return (
    <>
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
                    <button
                      onClick={() => setSeoFor({ article_id: a.article_id, title: a.title, slug: a.slug, status: a.status })}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-200 flex items-center gap-1"
                      style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                      aria-label={`Analyze SEO for ${a.title}`}
                    >
                      <Sparkles size={12} /> SEO
                    </button>
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

      {seoFor && (
        <ArticleSEOPanel
          article={seoFor}
          onClose={() => setSeoFor(null)}
        />
      )}
    </>
  )
}
