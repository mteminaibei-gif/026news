'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { formatNumber } from '@/lib/utils'
import { ArticleTagEditor } from './ArticleTagEditor'

type Article = {
  article_id: number; title: string; slug: string; status: string
  featured_image: string | null; views: number; earnings: number
  created_at: string; published_at: string | null
  is_aggregated: boolean; source_name: string | null
  category_id: number | null; tags: string[] | null
  excerpt: string | null; like_count: number; share_count: number
  save_count: number; featured: boolean
  author: { user_id: number; name: string; profile_image: string | null } | null
  category: { name: string; slug: string | null } | null
}

type Category = { category_id: number; name: string; slug: string | null }

const STATUS_COLORS: Record<string, string> = {
  published: 'var(--success)',
  under_review: 'var(--warning)',
  rejected: 'var(--error)',
  draft: 'var(--text-tertiary)',
  expired: 'var(--text-secondary)',
}

export function ArticleManager() {
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const limit = 25

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('type', typeFilter)

      const res = await fetch(`/api/admin/articles?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setArticles(data.articles || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, typeFilter])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === articles.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(articles.map(a => a.article_id)))
    }
  }

  const bulkAction = async (action: string) => {
    if (!selected.size) return
    if (action === 'delete' && !confirm(`Delete ${selected.size} article(s)?`)) return
    if (action === 'reject' && !confirm(`Reject ${selected.size} article(s)?`)) return

    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      })
      if (!res.ok) {
        const d = await res.json()
        setMessage({ type: 'error', text: d.error || 'Failed' })
        return
      }
      const d = await res.json()
      setMessage({ type: 'success', text: `${d.updated} article(s) ${action === 'delete' ? 'deleted' : action === 'approve' ? 'published' : action + 'd'}` })
      setSelected(new Set())
      fetchArticles()
      setTimeout(() => setMessage(null), 3000)
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setBulkLoading(false)
    }
  }

  const updateArticle = async (id: number, updates: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], ...updates }),
      })
      if (res.ok) fetchArticles()
    } catch {}
  }

  const toggleFeatured = (article: Article) => {
    updateArticle(article.article_id, { action: article.featured ? 'unfeature' : 'feature' })
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="px-4 py-3 rounded-xl text-sm font-semibold" style={{
          background: message.type === 'success' ? 'var(--success-light)' : 'var(--error-light)',
          color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
          border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
        }}>
          {message.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2.5 rounded-xl text-sm"
          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="under_review">Under Review</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="px-3 py-2.5 rounded-xl text-sm"
          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All Types</option>
          <option value="inhouse">In-House</option>
          <option value="sourced">RSS / Sourced</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>{selected.size} selected</span>
          <div className="flex-1" />
          <button onClick={() => bulkAction('approve')} disabled={bulkLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'var(--success)' }}>Publish</button>
          <button onClick={() => bulkAction('reject')} disabled={bulkLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'var(--warning)', color: 'var(--text-primary)' }}>Reject</button>
          <button onClick={() => bulkAction('delete')} disabled={bulkLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>Delete</button>
        </div>
      )}

      {/* Article list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 opacity-40">📭</div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No articles found</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          {/* Header */}
          <div className="px-4 py-2.5 flex items-center gap-3 text-xs font-semibold" style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
            <input
              type="checkbox"
              checked={selected.size === articles.length && articles.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded"
            />
            <span className="w-10 text-center">#</span>
            <span className="flex-1">Article</span>
            <span className="hidden md:block w-28">Author</span>
            <span className="hidden lg:block w-20 text-center">Views</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-24 text-center">Actions</span>
          </div>

          {/* Rows */}
          <div className="max-h-[700px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {articles.map((a, idx) => (
              <div
                key={a.article_id}
                className="px-4 py-3 flex items-center gap-3 transition-colors"
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background: selected.has(a.article_id) ? 'var(--primary-light)' : 'transparent',
                }}
                onMouseEnter={e => { if (!selected.has(a.article_id)) e.currentTarget.style.background = 'var(--bg-muted)' }}
                onMouseLeave={e => { if (!selected.has(a.article_id)) e.currentTarget.style.background = 'transparent' }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(a.article_id)}
                  onChange={() => toggleSelect(a.article_id)}
                  className="w-4 h-4 rounded shrink-0"
                />
                <span className="text-xs w-10 text-center shrink-0" style={{ color: 'var(--text-tertiary)' }}>{(page - 1) * limit + idx + 1}</span>

                {/* Thumbnail + Title */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  {a.featured_image ? (
                    <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0">
                      <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-10 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: 'var(--primary-light)' }}>📰</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {a.category?.name && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{a.category.name}</span>
                      )}
                      {a.is_aggregated && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'var(--info)', color: 'var(--text-inverse)' }}>RSS</span>
                      )}
                      {a.featured && (
                        <span className="text-[10px]" style={{ color: 'var(--warning)' }}>⭐</span>
                      )}
                      {a.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}>{tag}</span>
                      ))}
                      {a.tags && a.tags.length > 3 && <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>+{a.tags.length - 3}</span>}
                    </div>
                  </div>
                </div>

                {/* Author */}
                <div className="hidden md:flex items-center gap-2 w-28 shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: a.is_aggregated ? 'var(--info)' : 'var(--primary)', color: 'var(--text-inverse)' }}>
                    {(a.author?.name ?? a.source_name ?? '?').charAt(0)}
                  </div>
                  <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{a.author?.name ?? a.source_name ?? '—'}</span>
                </div>

                {/* Views */}
                <div className="hidden lg:block w-20 text-center shrink-0">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatNumber(a.views)}</span>
                </div>

                {/* Status */}
                <div className="w-20 text-center shrink-0">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                    style={{ background: `${STATUS_COLORS[a.status] || 'var(--text-tertiary)'}20`, color: STATUS_COLORS[a.status] || 'var(--text-tertiary)' }}
                  >
                    {a.status === 'under_review' ? 'Review' : a.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="w-24 shrink-0 flex items-center justify-end gap-1">
                  {a.status === 'under_review' && (
                    <>
                      <button
                        onClick={() => updateArticle(a.article_id, { action: 'approve' })}
                        className="px-2 py-1 rounded text-[10px] font-bold text-white"
                        style={{ background: 'var(--success)' }}
                        title="Approve & Publish"
                      >✓</button>
                      <button
                        onClick={() => updateArticle(a.article_id, { action: 'reject' })}
                        className="px-2 py-1 rounded text-[10px] font-bold"
                        style={{ background: 'var(--warning)', color: 'var(--text-primary)' }}
                        title="Reject"
                      >✗</button>
                    </>
                  )}
                  <button
                    onClick={() => toggleFeatured(a)}
                    className="px-2 py-1 rounded text-[10px] font-bold"
                    style={{ background: a.featured ? 'var(--warning-light)' : 'var(--bg-muted)', color: a.featured ? 'var(--warning)' : 'var(--text-tertiary)' }}
                    title={a.featured ? 'Unfeature' : 'Feature on homepage'}
                  >★</button>
                  <button
                    onClick={() => setEditingArticle(a)}
                    className="px-2 py-1 rounded text-[10px] font-bold"
                    style={{ background: 'var(--bg-muted)', color: 'var(--primary)' }}
                    title="Edit tags & category"
                  >✎</button>
                  <button
                    onClick={() => { if (confirm('Delete this article?')) updateArticle(a.article_id, { action: 'delete' }) }}
                    className="px-2 py-1 rounded text-[10px] font-bold"
                    style={{ background: 'var(--error-light)', color: 'var(--error)' }}
                    title="Delete"
                  >🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
            >← Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2
              if (p < 1 || p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-xs font-semibold"
                  style={{
                    background: p === page ? 'var(--primary)' : 'var(--bg-muted)',
                    color: p === page ? 'var(--text-inverse)' : 'var(--text-primary)',
                  }}
                >{p}</button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
            >Next →</button>
          </div>
        </div>
      )}

      {/* Tag editor modal */}
      {editingArticle && (
        <ArticleTagEditor
          articleId={editingArticle.article_id}
          currentTags={editingArticle.tags || []}
          currentCategoryId={editingArticle.category_id}
          onSaved={() => { fetchArticles(); setEditingArticle(null) }}
          onClose={() => setEditingArticle(null)}
        />
      )}
    </div>
  )
}
