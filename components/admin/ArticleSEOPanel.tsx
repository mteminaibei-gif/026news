'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { SEOAnalyzer } from '@/components/seo/SEOAnalyzer'
import { slugify } from '@/lib/utils'

interface ArticleSummary {
  article_id: number
  title: string
  slug: string
  status: string
}

export function ArticleSEOPanel({ article, onClose, onApplied }: {
  article: ArticleSummary
  onClose: () => void
  onApplied?: (applied: string[]) => void
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<{
    title: string; content: string; excerpt?: string | null; slug: string;
    featured_image: string | null; tags: string[] | null; category?: string | null; authorName?: string | null
  } | null>(null)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/articles/${article.article_id}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to load article')
      }
      const { article: a } = await res.json()
      setDetail({
        title: a.title,
        content: a.content,
        excerpt: a.excerpt,
        slug: a.slug,
        featured_image: a.featured_image ?? null,
        tags: Array.isArray(a.tags) ? a.tags : null,
        category: a.category?.name ?? null,
        authorName: a.author?.name ?? null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load article')
    } finally {
      setLoading(false)
    }
  }, [article.article_id])

  useEffect(() => { load() }, [load])

  const apply = useCallback(async (patch: Record<string, unknown>) => {
    setApplying(true)
    try {
      const res = await fetch(`/api/admin/articles/${article.article_id}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || 'Failed to apply')
      const fields = Array.isArray(j.applied) ? j.applied : Object.keys(patch)
      setApplied(prev => Array.from(new Set([...prev, ...fields])))
      onApplied?.(fields)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to apply changes')
    } finally {
      setApplying(false)
    }
  }, [article.article_id, onApplied])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SEO analysis"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 16px', overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 720, background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>AI SEO Analyzer</h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-inset)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {loading && (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--primary)' }} />
              <p style={{ fontSize: 13 }}>Loading article content…</p>
            </div>
          )}

          {error && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--error)' }}>
              <AlertCircle size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
              <p style={{ fontSize: 13 }}>{error}</p>
            </div>
          )}

          {detail && !loading && !error && (
            <>
              <SEOAnalyzer
                title={detail.title}
                content={detail.content}
                excerpt={detail.excerpt ?? undefined}
                slug={detail.slug}
                featuredImage={detail.featured_image ?? undefined}
                tags={detail.tags ?? undefined}
                category={detail.category ?? undefined}
                authorName={detail.authorName ?? undefined}
                onApplyTitle={(t) => apply({ title: t })}
                onApplyExcerpt={(e) => apply({ excerpt: e })}
                onApplyTags={(t) => apply({ tags: t })}
                onApplyContent={(c) => apply({ content: c })}
                onApplySlug={(s) => apply({ slug: s })}
              />

              {applied.length > 0 && (
                <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--success-light)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <div style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
                    <strong>Applied:</strong>{applied.map(f => <span key={f} style={{ marginLeft: 6, textTransform: 'capitalize', background: 'var(--bg-surface)', padding: '1px 8px', borderRadius: 999, fontSize: 11 }}>{f.replace('_', ' ')}</span>)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {applying && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
            <Loader2 className="animate-spin" size={28} style={{ color: 'var(--primary)' }} />
          </div>
        )}
      </div>
    </div>
  )
}
