'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { EnhancedSEOAnalysis } from '@/lib/seo/enhanced-analyzer'

interface Props {
  title: string
  content: string
  excerpt?: string
  slug?: string
  featuredImage?: string
  tags?: string[]
  category?: string
  authorName?: string
  onApplyTitle?: (title: string) => void
  onApplyExcerpt?: (excerpt: string) => void
  onApplyTags?: (tags: string[]) => void
  onApplyContent?: (content: string) => void
  onApplySlug?: (slug: string) => void
}

type IssueType = 'error' | 'warning' | 'info' | 'success'

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)'

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.25, fontWeight: 700, color }}>{score}</span>
      </div>
    </div>
  )
}

function IssueItem({ issue }: { issue: { type: IssueType; message: string; suggestion: string } }) {
  const icon = issue.type === 'error' ? '✗' : issue.type === 'warning' ? '⚠' : issue.type === 'info' ? 'ⓘ' : '✓'
  const color = issue.type === 'error' ? 'var(--error)' : issue.type === 'warning' ? 'var(--warning)' : issue.type === 'success' ? 'var(--success)' : 'var(--primary)'
  const bg = issue.type === 'error' ? 'var(--error-light)' : issue.type === 'warning' ? 'var(--warning-light)' : issue.type === 'success' ? 'var(--success-light)' : 'var(--primary-light)'

  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, background: bg, marginBottom: 6 }}>
      <span style={{ fontSize: 14, color, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{issue.message}</p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>{issue.suggestion}</p>
      </div>
    </div>
  )
}

function MetricBar({ label, value, max = 100, color = 'var(--primary)' }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{value}{max === 100 ? '%' : `/${max}`}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function ImageRecCard({ rec }: { rec: EnhancedSEOAnalysis['imageRecommendations'][number] }) {
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', padding: 12, marginBottom: 8, background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary)' }}>{rec.placementType}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>relevance {Math.round(rec.relevanceScore * 100)}%</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Alt: {rec.altText}</p>
      {rec.caption && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{rec.caption}</p>}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>Search query: “{rec.suggestedQuery}”</p>
    </div>
  )
}

function LayoutRecCard({ rec }: { rec: EnhancedSEOAnalysis['layoutRecommendations'][number] }) {
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle)', padding: 12, marginBottom: 8, background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent)' }}>{rec.type}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rec.impact} impact</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{rec.reason}</p>
      <pre style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-inset)', padding: 8, borderRadius: 6, overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{rec.recommendedHtml}</pre>
    </div>
  )
}

function ApplyButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { onClick(); setDone(true); setTimeout(() => setDone(false), 1200) }}
      style={{
        padding: '6px 12px', borderRadius: 8, border: 'none',
        background: done ? 'var(--success)' : 'var(--primary)', color: '#fff',
        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.3s',
      }}
    >
      {done ? '✓ Applied' : label}
    </button>
  )
}

function ContentSummaryCard({ summary }: { summary: EnhancedSEOAnalysis['contentSummary'] }) {
  return (
    <div style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', border: '2px solid var(--primary)', borderRadius: 8, padding: '2px 8px' }}>{summary.contentGrade}</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>AI Content Summary</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{summary.estimatedReadingTime} min read</p>
        </div>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)', margin: '0 0 12px' }}>{summary.executiveSummary}</p>
      {summary.keyTakeaways.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Key Takeaways</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {summary.keyTakeaways.map((t, i) => <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3 }}>{t}</li>)}
          </ul>
        </div>
      )}
      {summary.seoKeywords.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>SEO Keywords</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {summary.seoKeywords.map((k, i) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>
                {k.keyword} · {Math.round(k.density * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function SEOAnalyzer({
  title, content, excerpt, slug, featuredImage, tags, category, authorName,
  onApplyTitle, onApplyExcerpt, onApplyTags, onApplyContent, onApplySlug,
}: Props) {
  const [data, setData] = useState<EnhancedSEOAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'seo' | 'style' | 'content' | 'images' | 'layout' | 'social'>('seo')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runAnalysis = useCallback(async () => {
    if (!title || !content) return
    setLoading(true)
    try {
      const res = await fetch('/api/seo/analyze-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, excerpt, slug, featured_image: featuredImage, tags, category, authorName }),
      })
      if (res.ok) {
        setData(await res.json())
      } else {
        setData(null)
      }
    } catch (err) {
      console.error('Enhanced analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }, [title, content, excerpt, slug, featuredImage, tags, category, authorName])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!title || !content) return
    debounceRef.current = setTimeout(() => { runAnalysis() }, 1500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [title, content, excerpt, runAnalysis])

  const errors = data?.issues.filter(i => i.type === 'error') ?? []
  const warnings = data?.issues.filter(i => i.type === 'warning') ?? []
  const infos = data?.issues.filter(i => i.type === 'info' || i.type === 'success') ?? []

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'seo', label: 'SEO' },
    { id: 'style', label: 'Style' },
    { id: 'content', label: 'Content' },
    { id: 'images', label: 'Images' },
    { id: 'layout', label: 'Layout' },
    { id: 'social', label: 'Social' },
  ]

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>SEO & Content Analysis</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>AI-powered optimization engine</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading || !title || !content}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600,
            opacity: loading || !title || !content ? 0.5 : 1, transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Now'}
        </button>
      </div>

      {data && (
        <>
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid var(--border)' }}>
            <ScoreRing score={data.score} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '5px 10px', borderRadius: 6, border: '1px solid',
                      borderColor: activeTab === tab.id ? 'var(--primary)' : 'var(--border)',
                      background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                {errors.length > 0 && <span style={{ color: 'var(--error)' }}>{errors.length} errors</span>}
                {warnings.length > 0 && <span style={{ color: 'var(--warning)' }}>{warnings.length} warnings</span>}
                {infos.length > 0 && <span style={{ color: 'var(--text-muted)' }}>{infos.length} info</span>}
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 20px', maxHeight: 440, overflowY: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
            {activeTab === 'seo' && (
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>Issues</h4>
                {errors.map((issue, i) => <IssueItem key={`e${i}`} issue={issue} />)}
                {warnings.map((issue, i) => <IssueItem key={`w${i}`} issue={issue} />)}
                {infos.map((issue, i) => <IssueItem key={`i${i}`} issue={issue} />)}
                {data.improvedTitle && onApplyTitle && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, border: '1px dashed var(--primary)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Suggested Title</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>{data.improvedTitle}</p>
                    <ApplyButton label="Use This Title" onClick={() => onApplyTitle(data.improvedTitle!)} />
                  </div>
                )}
                {data.suggestedTags && data.suggestedTags.length > 0 && onApplyTags && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, border: '1px dashed var(--primary)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 6px' }}>Suggested Tags</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {data.suggestedTags.map((t, i) => (
                        <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <ApplyButton label="Apply Tags" onClick={() => onApplyTags!(data.suggestedTags!)} />
                  </div>
                )}
                {data.improvedSlug && onApplySlug && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, border: '1px dashed var(--primary)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Suggested Slug</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>{data.improvedSlug}</p>
                    <ApplyButton label="Use This Slug" onClick={() => onApplySlug(data.improvedSlug!)} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'style' && (
              <div>
                <MetricBar label="Overall SEO Score" value={data.score} color="var(--success)" />
                <MetricBar label="EEAT" value={data.metrics.eeatScore ?? 0} color="var(--accent)" />
                <MetricBar label="Topical Authority" value={data.metrics.topicalAuthority ?? 0} color="var(--warning)" />
                <MetricBar label="Content Freshness" value={data.metrics.contentFreshness ?? 0} />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10 }}>
                  Flesch Reading Ease: <strong>{data.metrics.fleschReadingEase ?? 'n/a'}</strong> · Word count: {data.metrics.contentWordCount ?? 0} · Read time: {data.metrics.readingTimeMinutes ?? 0} min
                </p>
                {data.improvedExcerpt && onApplyExcerpt && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, border: '1px dashed var(--primary)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Suggested Meta Description</p>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 6px' }}>{data.improvedExcerpt}</p>
                    <ApplyButton label="Use This Excerpt" onClick={() => onApplyExcerpt(data.improvedExcerpt!)} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'content' && (
              <div>
                <ContentSummaryCard summary={data.contentSummary} />
                {data.optimizedContent && onApplyContent && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, border: '1px dashed var(--primary)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 4px' }}>AI-Optimized Content</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                      Restructures headings, trims filler, and improves readability. Review before applying.
                    </p>
                    <ApplyButton label="Apply Optimized Content" onClick={() => onApplyContent!(data.optimizedContent)} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'images' && (
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
                  Image Recommendations ({data.imageRecommendations.length})
                </h4>
                {data.imageRecommendations.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No specific image placements suggested. Add a featured image for social sharing.</p>
                ) : (
                  data.imageRecommendations.map((rec, i) => <ImageRecCard key={i} rec={rec} />)
                )}
                <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'var(--bg-muted)' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                    Performance: {data.performanceHints.lazyLoadImages ? 'lazy-load images' : 'eager-load'} ·{' '}
                    {data.performanceHints.preloadFeatured ? 'preload featured' : 'no preload'} · est. load {data.performanceHints.estimatedLoadTime}s
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
                  Layout Improvements ({data.layoutRecommendations.length})
                </h4>
                {data.layoutRecommendations.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your structure looks solid. Consider adding subheadings for scannability.</p>
                ) : (
                  data.layoutRecommendations.map((rec, i) => <LayoutRecCard key={i} rec={rec} />)
                )}
              </div>
            )}

            {activeTab === 'social' && (
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>Social Optimization</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-muted)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>OG Title</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0' }}>{data.socialOptimization.ogTitle}</p>
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-muted)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>OG Description</p>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '2px 0 0' }}>{data.socialOptimization.ogDescription}</p>
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-muted)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>Twitter Card</p>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '2px 0 0' }}>{data.socialOptimization.twitterCard} — {data.socialOptimization.twitterTitle}</p>
                  </div>
                </div>
                {data.schemaMarkup && (
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>View Schema Markup</summary>
                    <pre style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-inset)', padding: 8, borderRadius: 6, overflowX: 'auto', marginTop: 6 }}>{data.schemaMarkup}</pre>
                  </details>
                )}
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}

      {!data && !loading && (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Enter a title and content, then click Analyze</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>The engine auto-analyses as you type — SEO, readability, AI content summary, image & layout suggestions, and social tags.</p>
        </div>
      )}
    </div>
  )
}
