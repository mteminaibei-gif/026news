'use client'

import { useState, useCallback } from 'react'

interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: string
  message: string
  suggestion: string
}

interface SEOAnalysis {
  score: number
  issues: SEOIssue[]
  metrics: Record<string, unknown>
  improvedTitle?: string
  improvedExcerpt?: string
  suggestedTags?: string[]
}

interface StyleImprovement {
  type: string
  original: string
  improved: string
  reason: string
}

interface ContentAnalysis {
  style: {
    tone: string
    readingLevel: string
    sentenceVariety: string
    voiceActive: number
    vocabularyRichness: number
    hookQuality: string
  }
  improvements: StyleImprovement[]
  enhancedTitle: string
  enhancedExcerpt: string
  summary: {
    overallAppeal: number
    seoOptimization: number
    readabilityScore: number
    engagementScore: number
  }
}

interface Props {
  title: string
  content: string
  excerpt?: string
  slug?: string
  featuredImage?: string
  tags?: string[]
  category?: string
  onApplyTitle?: (title: string) => void
  onApplyExcerpt?: (excerpt: string) => void
  onApplyTags?: (tags: string[]) => void
  onApplyContent?: (content: string) => void
}

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

function IssueItem({ issue }: { issue: SEOIssue }) {
  const icon = issue.type === 'error' ? '\u2717' : issue.type === 'warning' ? '\u26A0' : '\u2139'
  const color = issue.type === 'error' ? 'var(--error)' : issue.type === 'warning' ? 'var(--warning)' : 'var(--primary)'
  const bg = issue.type === 'error' ? 'var(--error-light)' : issue.type === 'warning' ? 'var(--warning-light)' : 'var(--primary-light)'

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

export function SEOAnalyzer({
  title, content, excerpt, slug, featuredImage, tags, category,
  onApplyTitle, onApplyExcerpt, onApplyTags, onApplyContent,
}: Props) {
  const [seoData, setSeoData] = useState<SEOAnalysis | null>(null)
  const [contentData, setContentData] = useState<ContentAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'seo' | 'style' | 'improve'>('seo')

  const analyze = useCallback(async () => {
    if (!title || !content) return
    setLoading(true)
    try {
      const [seoRes, improveRes] = await Promise.all([
        fetch('/api/seo/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, excerpt, slug, featured_image: featuredImage, tags, category }),
        }),
        fetch('/api/seo/improve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, excerpt, tags }),
        }),
      ])
      if (seoRes.ok) setSeoData(await seoRes.json())
      if (improveRes.ok) setContentData(await improveRes.json())
    } catch (err) {
      console.error('Analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }, [title, content, excerpt, slug, featuredImage, tags, category])

  const errors = seoData?.issues.filter(i => i.type === 'error') ?? []
  const warnings = seoData?.issues.filter(i => i.type === 'warning') ?? []
  const infos = seoData?.issues.filter(i => i.type === 'info') ?? []

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>SEO & Content Analysis</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>Analyze and optimize your article</p>
        </div>
        <button
          onClick={analyze}
          disabled={loading || !title || !content}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600,
            opacity: loading || !title || !content ? 0.5 : 1, transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {seoData && (
        <>
          {/* Score + Tabs */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid var(--border)' }}>
            <ScoreRing score={seoData.score} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {(['seo', 'style', 'improve'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: '1px solid',
                      borderColor: activeTab === tab ? 'var(--primary)' : 'var(--border)',
                      background: activeTab === tab ? 'var(--primary-light)' : 'transparent',
                      color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                    }}>
                    {tab === 'seo' ? 'SEO' : tab === 'style' ? 'Style' : 'Improve'}
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

          {/* Tab Content */}
          <div style={{ padding: '16px 20px', maxHeight: 400, overflowY: 'auto' }}>
            {activeTab === 'seo' && (
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>Issues</h4>
                {errors.map((issue, i) => <IssueItem key={`e${i}`} issue={issue} />)}
                {warnings.map((issue, i) => <IssueItem key={`w${i}`} issue={issue} />)}
                {infos.map((issue, i) => <IssueItem key={`i${i}`} issue={issue} />)}
              </div>
            )}

            {activeTab === 'style' && contentData && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-muted)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>Tone</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0', textTransform: 'capitalize' }}>{contentData.style.tone}</p>
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-muted)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>Reading Level</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0', textTransform: 'capitalize' }}>{contentData.style.readingLevel}</p>
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-muted)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>Hook Quality</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0', textTransform: 'capitalize' }}>{contentData.style.hookQuality}</p>
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-muted)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>Active Voice</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0' }}>{contentData.style.voiceActive}%</p>
                  </div>
                </div>

                <MetricBar label="Overall Appeal" value={contentData.summary.overallAppeal} color="var(--primary)" />
                <MetricBar label="SEO Optimization" value={contentData.summary.seoOptimization} color="var(--success)" />
                <MetricBar label="Readability" value={contentData.summary.readabilityScore} color="var(--warning)" />
                <MetricBar label="Engagement" value={contentData.summary.engagementScore} color="var(--accent)" />
              </div>
            )}

            {activeTab === 'improve' && contentData && (
              <div>
                {contentData.improvements.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
                    Your content is well-optimized!
                  </p>
                ) : (
                  contentData.improvements.map((imp, i) => (
                    <div key={i} style={{ marginBottom: 12, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <div style={{ padding: '8px 12px', background: 'var(--bg-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{imp.type}</span>
                        <button
                          onClick={() => {
                            if (imp.type === 'headline' && onApplyTitle) onApplyTitle(imp.improved)
                            else if (imp.type === 'hook' && onApplyContent) onApplyContent(imp.improved)
                          }}
                          style={{
                            padding: '3px 8px', borderRadius: 4, border: '1px solid var(--primary)',
                            background: 'var(--primary-light)', color: 'var(--primary)',
                            fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Apply
                        </button>
                      </div>
                      <div style={{ padding: 10 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Original</p>
                        <p style={{ fontSize: 12, color: 'var(--error)', margin: '0 0 8px', padding: '4px 8px', background: 'var(--error-light)', borderRadius: 4, textDecoration: 'line-through' }}>
                          {imp.original.substring(0, 120)}{imp.original.length > 120 ? '...' : ''}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Improved</p>
                        <p style={{ fontSize: 12, color: 'var(--success)', margin: '0 0 6px', padding: '4px 8px', background: 'var(--success-light)', borderRadius: 4 }}>
                          {imp.improved.substring(0, 120)}{imp.improved.length > 120 ? '...' : ''}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>{imp.reason}</p>
                      </div>
                    </div>
                  ))
                )}

                {/* Quick Actions */}
                {contentData.enhancedTitle && onApplyTitle && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, border: '1px dashed var(--primary)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Suggested Title</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>{contentData.enhancedTitle}</p>
                    <button onClick={() => onApplyTitle(contentData.enhancedTitle)}
                      style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Use This Title
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {!seoData && !loading && (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Enter a title and content, then click Analyze</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>The algorithm will check SEO, readability, style, and suggest improvements</p>
        </div>
      )}
    </div>
  )
}
