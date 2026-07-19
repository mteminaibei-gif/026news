'use client'

import { useCallback, useRef, useState } from 'react'
import { Sparkles, Wand2, Check, X, Loader2, AlertTriangle } from 'lucide-react'

type Mode = 'grammar' | 'style' | 'cohesion' | 'paraphrase' | 'full'

interface Suggestion {
  type: 'error' | 'warning' | 'info' | 'success'
  category: 'grammar' | 'style' | 'cohesion' | 'structure'
  message: string
  suggestion: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  excerpt?: string
}

interface Analysis {
  score: number
  readability: { flesch: number; grade: string; avgWordsPerSentence: number }
  summary: string
  suggestions: Suggestion[]
}

interface RewriteResult {
  html: string
  summary: string
  changes: string[]
}

interface Props {
  title: string
  content: string
  onApplyContent: (html: string) => void
}

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: 'grammar', label: 'Grammar', hint: 'Fix errors only' },
  { key: 'style', label: 'Style', hint: 'Clarity & voice' },
  { key: 'cohesion', label: 'Cohesion', hint: 'Flow & structure' },
  { key: 'paraphrase', label: 'Paraphrase', hint: 'Fresh rewording' },
  { key: 'full', label: 'Full', hint: 'Everything' },
]

const TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  error: { bg: 'var(--error-light)', fg: 'var(--error)' },
  warning: { bg: 'var(--warning-light)', fg: 'var(--warning)' },
  info: { bg: 'var(--primary-light)', fg: 'var(--primary)' },
  success: { bg: 'var(--success-light)', fg: 'var(--success)' },
}

export function AIEnhancePanel({ title, content, onApplyContent }: Props) {
  const [mode, setMode] = useState<Mode>('full')
  const [analyzing, setAnalyzing] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [rewrite, setRewrite] = useState<RewriteResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const reqId = useRef(0)

  const runAnalyze = useCallback(async () => {
    if (!title || !content) {
      setError('Add a title and some content first.')
      return
    }
    const id = ++reqId.current
    setAnalyzing(true)
    setError(null)
    setAnalysis(null)
    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', title, content, mode }),
      })
      const data = await res.json()
      if (id !== reqId.current) return
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data as Analysis)
    } catch (e) {
      if (id !== reqId.current) return
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      if (id === reqId.current) setAnalyzing(false)
    }
  }, [title, content, mode])

  const runRewrite = useCallback(async () => {
    if (!title || !content) {
      setError('Add a title and some content first.')
      return
    }
    const id = ++reqId.current
    setRewriting(true)
    setError(null)
    setRewrite(null)
    setAnalysis(null)
    setShowPreview(false)
    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rewrite', title, content, mode }),
      })
      const data = await res.json()
      if (id !== reqId.current) return
      if (!res.ok) throw new Error(data.error || 'Rewrite failed')
      setRewrite(data as RewriteResult)
      setShowPreview(true)
    } catch (e) {
      if (id !== reqId.current) return
      setError(e instanceof Error ? e.message : 'Rewrite failed')
    } finally {
      if (id === reqId.current) setRewriting(false)
    }
  }, [title, content, mode])

  const scoreColor =
    analysis && analysis.score >= 80 ? 'var(--success)' : analysis && analysis.score >= 50 ? 'var(--warning)' : 'var(--error)'

// Classify environment/config problems (missing key, quota) so authors see
  // a clear, non-alarming banner instead of a generic failure.
  const configError = error
    ? /not configured|GROQ_API_KEY|quota|429|exceeded your current/i.test(error)
    : false

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h4 className="text-[11px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
          <Sparkles size={13} /> AI Enhance
        </h4>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode selector */}
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              title={m.hint}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
              style={{
                background: mode === m.key ? 'var(--accent)' : 'var(--bg-muted)',
                color: mode === m.key ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={runAnalyze}
            disabled={analyzing || rewriting}
            className="flex-1 text-[11px] font-bold px-3 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
          >
            {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {analyzing ? 'Analyzing…' : 'Analyze'}
          </button>
          <button
            onClick={runRewrite}
            disabled={analyzing || rewriting}
            className="flex-1 text-[11px] font-bold px-3 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {rewriting ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
            {rewriting ? 'Rewriting…' : 'Enhance'}
          </button>
        </div>

{error && configError && (
          <div className="text-xs p-3 rounded-xl flex items-start gap-2" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-px" />
            <span>
              AI features are temporarily unavailable (Groq API key missing or out of quota).
              Add a valid <code>GROQ_API_KEY</code> in your server environment to enable analysis & rewriting.
            </span>
          </div>
        )}
        {error && !configError && (
          <div className="text-xs p-3 rounded-xl flex items-start gap-2" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        {/* Analysis results */}
        {analysis && !analyzing && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                style={{ background: 'var(--bg-muted)', color: scoreColor, border: `2px solid ${scoreColor}` }}
              >
                {analysis.score}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Editorial quality</p>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  {analysis.readability.grade} · Flesch {analysis.readability.flesch} ·{' '}
                  {analysis.readability.avgWordsPerSentence} w/sent
                </p>
              </div>
            </div>

            {analysis.summary && (
              <p className="text-xs leading-relaxed p-3 rounded-xl" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                {analysis.summary}
              </p>
            )}

            {analysis.suggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-tertiary)' }}>
                  {analysis.suggestions.length} suggestions
                </p>
                {analysis.suggestions.map((s, i) => {
                  const c = TYPE_COLOR[s.type] ?? TYPE_COLOR.info
                  return (
                    <div key={i} className="p-2.5 rounded-xl" style={{ background: c.bg, color: c.fg }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.06)' }}>
                          {s.category}
                        </span>
                        <span className="text-[9px] font-bold uppercase opacity-70">{s.priority}</span>
                      </div>
                      <p className="text-xs font-medium mt-1">{s.message}</p>
                      {s.suggestion && <p className="text-[11px] mt-0.5 opacity-90">→ {s.suggestion}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Rewrite preview (review-then-apply) */}
        {rewrite && showPreview && !rewriting && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-tertiary)' }}>
                Suggested rewrite
              </span>
            </div>
            {rewrite.changes.length > 0 && (
              <ul className="text-[11px] space-y-0.5 pl-4 list-disc" style={{ color: 'var(--text-secondary)' }}>
                {rewrite.changes.slice(0, 8).map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
            <div
              className="max-h-64 overflow-auto rounded-xl p-3 text-xs leading-relaxed rich-editor-content"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{ __html: rewrite.html }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onApplyContent(rewrite.html)
                  setShowPreview(false)
                  setRewrite(null)
                }}
                className="flex-1 text-[11px] font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5"
                style={{ background: 'var(--success)', color: '#fff' }}
              >
                <Check size={13} /> Apply to editor
              </button>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setRewrite(null)
                }}
                className="flex-1 text-[11px] font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              >
                <X size={13} /> Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
