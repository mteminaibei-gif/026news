'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { timeAgo, formatNumber } from '@/lib/utils'
import { sanitizeArticleHtml } from '@/lib/sanitizeHtml'
import { FileText, Eye, CheckCircle, XCircle, RotateCcw, Clock, User, Folder } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface ReviewArticle {
  article_id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  status: string
  featured_image: string | null
  tags: string[] | null
  monetization_type: string
  created_at: string
  author: { name: string; profile_image: string | null } | null
  category: { name: string } | null
}

type ActionState = 'idle' | 'approving' | 'rejecting' | 'returning'

export default function AdminReviewsPage() {
  const { toast } = useToast()
  const [articles, setArticles] = useState<ReviewArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ReviewArticle | null>(null)
  const [actionState, setActionState] = useState<ActionState>('idle')
  const [notes, setNotes] = useState('')
  const [newCount, setNewCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    fetchArticles()

    const supabase = createClient()
    const channel = supabase
      .channel('admin-reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articles', filter: 'status=eq.under_review' },
        () => {
          fetchArticles()
          setNewCount(c => c + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchArticles() {
    setLoading(true)
    try {
      const res = await fetch('/api/articles/review')
      if (res.ok) {
        const data = await res.json()
        setArticles(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleAction(action: 'approve' | 'reject' | 'revision', articleId: number) {
    setActionState(action === 'approve' ? 'approving' : action === 'reject' ? 'rejecting' : 'returning')
    try {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: articleId, action, notes: notes || null }),
      })
      if (res.ok) {
        setSelected(null)
        setNotes('')
        fetchArticles()
      } else {
        const d = await res.json()
        toast(d.error ?? 'Action failed', 'error')
      }
    } catch { toast('Network error', 'error') }
    setActionState('idle')
  }

  const filtered = articles.filter(a => {
    if (filter === 'all') return true
    if (filter === 'pending') return a.status === 'under_review'
    if (filter === 'approved') return a.status === 'published'
    if (filter === 'rejected') return a.status === 'rejected'
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Article Reviews
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {articles.filter(a => a.status === 'under_review').length} articles pending review
          </p>
        </div>
        {newCount > 0 && (
          <button
            onClick={() => { setNewCount(0); fetchArticles() }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)', cursor: 'pointer', border: 'none' }}
          >
            {newCount} new submission{newCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'pending' as const, label: 'Pending', count: articles.filter(a => a.status === 'under_review').length },
          { key: 'approved' as const, label: 'Published', count: articles.filter(a => a.status === 'published').length },
          { key: 'rejected' as const, label: 'Rejected', count: articles.filter(a => a.status === 'rejected').length },
          { key: 'all' as const, label: 'All', count: articles.length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filter === f.key ? 'var(--primary)' : 'var(--bg-muted)',
              color: filter === f.key ? 'var(--text-inverse)' : 'var(--text-secondary)',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <FileText size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No articles to review</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {filter === 'pending' ? 'All articles have been reviewed' : 'No articles match this filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(article => (
            <div
              key={article.article_id}
              className="rounded-xl p-4 transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderLeft: article.status === 'under_review' ? '4px solid var(--warning)' : article.status === 'published' ? '4px solid var(--success)' : '4px solid var(--error)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                      style={{
                        background: article.status === 'under_review' ? 'var(--warning-light)' : article.status === 'published' ? 'var(--success-light)' : 'var(--error-light)',
                        color: article.status === 'under_review' ? 'var(--warning)' : article.status === 'published' ? 'var(--success)' : 'var(--error)',
                      }}
                    >
                      {article.status === 'under_review' ? 'Pending' : article.status === 'published' ? 'Published' : 'Rejected'}
                    </span>
                    {article.category && (
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                        <Folder size={10} className="inline mr-0.5" />{article.category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    <span><User size={10} className="inline mr-0.5" />{article.author?.name ?? 'Unknown'}</span>
                    <span><Clock size={10} className="inline mr-0.5" />{timeAgo(article.created_at)}</span>
                    {article.tags && article.tags.length > 0 && (
                      <span>{article.tags.slice(0, 3).join(', ')}{article.tags.length > 3 ? ` +${article.tags.length - 3}` : ''}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelected(selected?.article_id === article.article_id ? null : article)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', cursor: 'pointer', border: 'none' }}
                  >
                    <Eye size={12} /> Read
                  </button>
                  {article.status === 'under_review' && (
                    <>
                      <button
                        onClick={() => handleAction('approve', article.article_id)}
                        disabled={actionState !== 'idle'}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                        style={{ background: 'var(--success)', color: '#fff', cursor: 'pointer', border: 'none', opacity: actionState !== 'idle' ? 0.5 : 1 }}
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button
                        onClick={() => { setSelected(article); setNotes('') }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                        style={{ background: 'var(--warning-light)', color: 'var(--warning)', cursor: 'pointer', border: 'none' }}
                      >
                        <RotateCcw size={12} /> Return
                      </button>
                      <button
                        onClick={() => handleAction('reject', article.article_id)}
                        disabled={actionState !== 'idle'}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                        style={{ background: 'var(--error-light)', color: 'var(--error)', cursor: 'pointer', border: 'none', opacity: actionState !== 'idle' ? 0.5 : 1 }}
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded article preview */}
              {selected?.article_id === article.article_id && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {article.featured_image && (
                    <img src={article.featured_image} alt="" className="w-full h-48 object-cover rounded-lg mb-3" />
                  )}
                  <div
                    className="rich-editor-content text-sm leading-relaxed mb-4"
                    style={{ color: 'var(--text-primary)', maxHeight: 400, overflowY: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }}
                  />

                  {/* Revision notes (for return for amendments) */}
                  {article.status === 'under_review' && (
                    <div className="mb-4">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Revision Notes (for returning to author)
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Explain what needs to be changed..."
                        rows={3}
                        className="w-full rounded-xl px-4 py-2.5 text-sm"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', resize: 'vertical' }}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleAction('revision', article.article_id)}
                          disabled={actionState !== 'idle'}
                          className="px-4 py-2 rounded-xl text-xs font-semibold"
                          style={{ background: 'var(--warning)', color: '#fff', cursor: 'pointer', border: 'none', opacity: actionState !== 'idle' ? 0.5 : 1 }}
                        >
                          {actionState === 'returning' ? 'Returning...' : 'Return for Amendments'}
                        </button>
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/article/${article.slug}`}
                    target="_blank"
                    className="text-xs font-semibold"
                    style={{ color: 'var(--primary)' }}
                  >
                    View full article →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
