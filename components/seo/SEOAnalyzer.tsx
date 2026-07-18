'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from 'framer-motion'
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

function AnimatedScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const bgColor = score >= 80 ? 'rgba(34,197,94,0.1)' : score >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'

  const motionVal = useMotionValue(0)
  const springVal = useSpring(motionVal, { stiffness: 60, damping: 15 })
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    const controls = animate(motionVal, score, { duration: 1.2, ease: 'easeOut' })
    const unsub = springVal.on('change', v => setDisplayScore(Math.round(v)))
    return () => { controls.stop(); unsub() }
  }, [score, motionVal, springVal])

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill={bgColor} stroke="var(--border)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {displayScore}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          score
        </span>
      </div>
    </div>
  )
}

function IssueItem({ issue, index }: { issue: { type: IssueType; message: string; suggestion: string }; index: number }) {
  const icon = issue.type === 'error' ? '✗' : issue.type === 'warning' ? '!' : issue.type === 'info' ? 'i' : '✓'
  const color = issue.type === 'error' ? '#ef4444' : issue.type === 'warning' ? '#f59e0b' : issue.type === 'success' ? '#22c55e' : 'var(--primary)'
  const bg = issue.type === 'error' ? 'rgba(239,68,68,0.08)' : issue.type === 'warning' ? 'rgba(245,158,11,0.08)' : issue.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(99,102,241,0.08)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: bg, marginBottom: 6, border: `1px solid ${color}15` }}>
      <span style={{
        width: 22, height: 22, borderRadius: 6, background: `${color}18`, color,
        fontSize: 12, fontWeight: 800, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{issue.message}</p>
        {issue.suggestion && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>{issue.suggestion}</p>}
      </div>
    </motion.div>
  )
}

function MetricBar({ label, value, max = 100, color = 'var(--primary)', delay = 0 }: { label: string; value: number; max?: number; color?: string; delay?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {value}{max === 100 ? '%' : `/${max}`}
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4, background: color }} />
      </div>
    </div>
  )
}

function ImageRecCard({ rec }: { rec: EnhancedSEOAnalysis['imageRecommendations'][number] }) {
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle, var(--border))', padding: 12, marginBottom: 8, background: 'var(--bg-muted)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary)' }}>{rec.placementType}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>relevance {Math.round(rec.relevanceScore * 100)}%</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Alt: {rec.altText}</p>
      {rec.caption && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{rec.caption}</p>}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>Search query: &ldquo;{rec.suggestedQuery}&rdquo;</p>
    </div>
  )
}

function LayoutRecCard({ rec }: { rec: EnhancedSEOAnalysis['layoutRecommendations'][number] }) {
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border-subtle, var(--border))', padding: 12, marginBottom: 8, background: 'var(--bg-muted)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent)' }}>{rec.type}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rec.impact} impact</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{rec.reason}</p>
      <pre style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-inset)', padding: 8, borderRadius: 6, overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>{rec.recommendedHtml}</pre>
    </div>
  )
}

function ApplyButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { onClick(); setDone(true); setTimeout(() => setDone(false), 1500) }}
      style={{
        padding: '7px 14px', borderRadius: 8, border: 'none',
        background: done ? '#22c55e' : 'var(--primary)', color: '#fff',
        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s',
        boxShadow: done ? '0 2px 8px rgba(34,197,94,0.3)' : '0 2px 8px rgba(99,102,241,0.2)',
        transform: done ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      {done ? '✓ Applied' : label}
    </button>
  )
}

function ContentSummaryCard({ summary }: { summary: EnhancedSEOAnalysis['contentSummary'] }) {
  return (
    <div style={{ padding: 14, borderRadius: 14, border: '1px solid var(--border-subtle, var(--border))', background: 'var(--bg-muted)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          fontSize: 18, fontWeight: 900, flexShrink: 0,
        }}>{summary.contentGrade}</div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>AI Content Summary</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{summary.estimatedReadingTime} min read</p>
        </div>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 14px' }}>{summary.executiveSummary}</p>
      {summary.keyTakeaways.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Key Takeaways</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {summary.keyTakeaways.map((t, i) => <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.4 }}>{t}</li>)}
          </ul>
        </div>
      )}
      {summary.seoKeywords.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>SEO Keywords</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {summary.seoKeywords.map((k, i) => (
              <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontWeight: 600 }}>
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
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'seo' | 'style' | 'content' | 'images' | 'layout' | 'social'>('seo')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runAnalysis = useCallback(async () => {
    if (!title || !content) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/seo/analyze-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, excerpt, slug, featured_image: featuredImage, tags, category, authorName }),
      })
      if (res.ok) {
        setData(await res.json())
      } else {
        const errBody = await res.json().catch(() => ({}))
        setError(errBody.error || `Analysis failed (${res.status})`)
        setData(null)
      }
    } catch (err) {
      console.error('Enhanced analysis failed:', err)
      setError('Network error — could not reach analysis server')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [title, content, excerpt, slug, featuredImage, tags, category, authorName])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!title || !content) return
    debounceRef.current = setTimeout(() => { runAnalysis() }, 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [title, content, runAnalysis])

  const errors = data?.issues.filter(i => i.type === 'error') ?? []
  const warnings = data?.issues.filter(i => i.type === 'warning') ?? []
  const infos = data?.issues.filter(i => i.type === 'info' || i.type === 'success') ?? []

  const tabs: { id: typeof activeTab; label: string; icon: string; count?: number }[] = [
    { id: 'seo',     label: 'Issues', icon: '⚠', count: errors.length + warnings.length },
    { id: 'style',   label: 'Metrics', icon: '📊' },
    { id: 'content', label: 'Content', icon: '✍' },
    { id: 'images',  label: 'Images', icon: '🖼', count: data?.imageRecommendations.length },
    { id: 'layout',  label: 'Layout', icon: '📐', count: data?.layoutRecommendations.length },
    { id: 'social',  label: 'Social', icon: '🔗' },
  ]

  const scoreLabel = (data?.score ?? 0) >= 80 ? 'Great' : (data?.score ?? 0) >= 50 ? 'Needs work' : 'Poor'
  const scoreColor = (data?.score ?? 0) >= 80 ? '#22c55e' : (data?.score ?? 0) >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(to right, rgba(99,102,241,0.04), rgba(168,85,247,0.04))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14,
          }}>⚡</div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>SEO & Content Analysis</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0' }}>AI-powered optimization engine</p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading || !title || !content}
          style={{
            padding: '8px 16px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: '#fff',
            fontSize: 12, fontWeight: 600, boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
            opacity: loading || !title || !content ? 0.45 : 1, transition: 'all 0.2s',
          }}
        >
          {loading ? '⏳ Analyzing...' : '⚡ Analyze'}
        </button>
      </div>

      {data && (
        <>
          {/* Score + Tabs */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              <AnimatedScoreRing score={data.score} size={100} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: scoreColor, fontVariantNumeric: 'tabular-nums' }}>{data.score}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>/ 100</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: `${scoreColor}15`, color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{scoreLabel}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                  {errors.length > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>{errors.length} error{errors.length > 1 ? 's' : ''}</span>}
                  {warnings.length > 0 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>{warnings.length} warning{warnings.length > 1 ? 's' : ''}</span>}
                  {infos.length > 0 && <span style={{ color: '#22c55e', fontWeight: 600 }}>{infos.length} ok</span>}
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: isActive ? 'var(--primary)' : 'var(--bg-muted)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
                      boxShadow: isActive ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
                    }}>
                    <span>{tab.icon}</span>
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                        background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--border)',
                        color: isActive ? '#fff' : 'var(--text-muted)',
                      }}>{tab.count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ padding: '16px 20px', maxHeight: 480, overflowY: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >

                {/* ── ISSUES TAB ── */}
                {activeTab === 'seo' && (
                  <div>
                    {data.improvedTitle && onApplyTitle && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ marginBottom: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', margin: '0 0 4px' }}>Suggested Title</p>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{data.improvedTitle}</p>
                          </div>
                          <ApplyButton label="Use This Title" onClick={() => onApplyTitle(data.improvedTitle!)} />
                        </div>
                      </motion.div>
                    )}
                    {data.improvedSlug && onApplySlug && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ marginBottom: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', margin: '0 0 4px' }}>Suggested Slug</p>
                            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>{data.improvedSlug}</p>
                          </div>
                          <ApplyButton label="Use Slug" onClick={() => onApplySlug(data.improvedSlug!)} />
                        </div>
                      </motion.div>
                    )}
                    {data.suggestedTags && data.suggestedTags.length > 0 && onApplyTags && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ marginBottom: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', margin: '0 0 6px' }}>Suggested Tags</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {data.suggestedTags.map((t, i) => (
                                <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontWeight: 600 }}>{t}</span>
                              ))}
                            </div>
                          </div>
                          <ApplyButton label="Apply Tags" onClick={() => onApplyTags!(data.suggestedTags!)} />
                        </div>
                      </motion.div>
                    )}
                    {errors.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', margin: '0 0 8px' }}>Errors ({errors.length})</p>
                        {errors.map((issue, i) => <IssueItem key={`e${i}`} issue={issue} index={i} />)}
                      </div>
                    )}
                    {warnings.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', margin: '0 0 8px' }}>Warnings ({warnings.length})</p>
                        {warnings.map((issue, i) => <IssueItem key={`w${i}`} issue={issue} index={i} />)}
                      </div>
                    )}
                    {infos.length > 0 && (
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', margin: '0 0 8px' }}>Passed ({infos.length})</p>
                        {infos.map((issue, i) => <IssueItem key={`i${i}`} issue={issue} index={i} />)}
                      </div>
                    )}
                  </div>
                )}

                {/* ── METRICS TAB ── */}
                {activeTab === 'style' && (
                  <div>
                    <MetricBar label="Overall SEO Score" value={data.score} color="#22c55e" />
                    <MetricBar label="EEAT" value={data.metrics.eeatScore ?? 0} color="var(--accent)" delay={0.05} />
                    <MetricBar label="Topical Authority" value={data.metrics.topicalAuthority ?? 0} color="#f59e0b" delay={0.1} />
                    <MetricBar label="Content Freshness" value={data.metrics.contentFreshness ?? 0} delay={0.15} />
                    <div style={{
                      marginTop: 14, padding: 12, borderRadius: 10, background: 'var(--bg-muted)',
                      border: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 12,
                    }}>
                      {[
                        { label: 'Reading ease', value: data.metrics.fleschReadingEase ?? '—' },
                        { label: 'Words', value: data.metrics.contentWordCount ?? 0 },
                        { label: 'Read time', value: `${data.metrics.readingTimeMinutes ?? 0} min` },
                      ].map(item => (
                        <div key={item.label} style={{ minWidth: 80 }}>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px' }}>{item.label}</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {data.improvedExcerpt && onApplyExcerpt && (
                      <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', margin: '0 0 4px' }}>Suggested Meta Description</p>
                            <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>{data.improvedExcerpt}</p>
                          </div>
                          <ApplyButton label="Use Excerpt" onClick={() => onApplyExcerpt(data.improvedExcerpt!)} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── CONTENT TAB ── */}
                {activeTab === 'content' && (
                  <div>
                    <ContentSummaryCard summary={data.contentSummary} />
                    {data.optimizedContent && onApplyContent && (
                      <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f59e0b', margin: '0 0 4px' }}>AI-Optimized Content</p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                              Restructures headings, trims filler, and improves readability. Review the changes before publishing.
                            </p>
                          </div>
                          <ApplyButton label="Apply Content" onClick={() => onApplyContent!(data.optimizedContent)} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── IMAGES TAB ── */}
                {activeTab === 'images' && (
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
                      Image Recommendations ({data.imageRecommendations.length})
                    </h4>
                    {data.imageRecommendations.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', borderRadius: 12, background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 28, margin: '0 0 6px' }}>🖼</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>No specific image placements suggested.</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Add a featured image for better social sharing.</p>
                      </div>
                    ) : (
                      data.imageRecommendations.map((rec, i) => <ImageRecCard key={i} rec={rec} />)
                    )}
                    <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                        Performance: {data.performanceHints.lazyLoadImages ? 'lazy-load images' : 'eager-load'} ·{' '}
                        {data.performanceHints.preloadFeatured ? 'preload featured' : 'no preload'} · est. {data.performanceHints.estimatedLoadTime}s load
                      </p>
                    </div>
                  </div>
                )}

                {/* ── LAYOUT TAB ── */}
                {activeTab === 'layout' && (
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
                      Layout Improvements ({data.layoutRecommendations.length})
                    </h4>
                    {data.layoutRecommendations.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', borderRadius: 12, background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 28, margin: '0 0 6px' }}>📐</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Your structure looks solid.</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Consider adding subheadings for better scannability.</p>
                      </div>
                    ) : (
                      data.layoutRecommendations.map((rec, i) => <LayoutRecCard key={i} rec={rec} />)
                    )}
                  </div>
                )}

                {/* ── SOCIAL TAB ── */}
                {activeTab === 'social' && (
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Social Optimization</h4>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {[
                        { label: 'OG Title', value: data.socialOptimization.ogTitle },
                        { label: 'OG Description', value: data.socialOptimization.ogDescription },
                        { label: 'Twitter Card', value: `${data.socialOptimization.twitterCard} — ${data.socialOptimization.twitterTitle}` },
                      ].map(item => (
                        <div key={item.label} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 4px' }}>{item.label}</p>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {data.schemaMarkup && (
                      <details style={{ marginTop: 12 }}>
                        <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', padding: '6px 0' }}>View Schema Markup</summary>
                        <pre style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-inset)', padding: 10, borderRadius: 8, overflowX: 'auto', marginTop: 6, border: '1px solid var(--border)' }}>{data.schemaMarkup}</pre>
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
          {error ? (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>⚠️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Analysis failed</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>{error}</p>
              <button
                onClick={runAnalysis}
                disabled={!title || !content}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600 }}
              >
                Retry Analysis
              </button>
            </>
          ) : (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>⚡</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Enter a title and content</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>The engine auto-analyses as you type — SEO, readability, AI content summary, image &amp; layout suggestions, and social tags.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
