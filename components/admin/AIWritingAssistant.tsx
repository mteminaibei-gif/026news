'use client'

import { useCallback, useState } from 'react'
import { optimizeContentLayout } from '@/lib/auto-categorize'

interface Props {
  title: string
  content: string
  excerpt: string
  wordCount: number
  readMins: number
  onApplyContent: (content: string) => void
  onApplyExcerpt: (excerpt: string) => void
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

export function AIWritingAssistant({ title, content, excerpt, wordCount, readMins, onApplyContent, onApplyExcerpt }: Props) {
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const handleSmartFormat = useCallback(() => {
    setActiveAction('format')
    const optimized = optimizeContentLayout(content)
    onApplyContent(optimized)
    setResult('✓ Content formatted with subheadings and paragraph breaks')
    setTimeout(() => { setActiveAction(null); setResult(null) }, 2000)
  }, [content, onApplyContent])

  const handleGenerateExcerpt = useCallback(() => {
    setActiveAction('excerpt')
    const plain = stripHtml(content)
    const generated = plain.length > 160 ? plain.substring(0, 157) + '…' : plain
    onApplyExcerpt(generated)
    setResult(`✓ Excerpt generated (${generated.length} chars)`)
    setTimeout(() => { setActiveAction(null); setResult(null) }, 2000)
  }, [content, onApplyExcerpt])

  const handleAnalyzeReadability = useCallback(() => {
    setActiveAction('readability')
    const plain = stripHtml(content)
    const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1
    const syllables = plain.split(/\s+/).filter(w => w.length > 0).reduce((s, w) => {
      const word = w.toLowerCase().replace(/[^a-z]/g, '')
      if (word.length <= 3) return s + 1
      const matches = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g)
      return s + (matches ? matches.length : 1)
    }, 0)
    const flesch = wordCount > 0 && sentences > 0
      ? Math.round(206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount))
      : 0

    const grade = flesch >= 70 ? 'Easy to read' : flesch >= 50 ? 'Moderately readable' : flesch >= 30 ? 'Difficult' : 'Very complex'
    setResult(`📊 Readability: ${flesch}/100 (${grade}) — ${sentences} sentences, avg ${Math.round(wordCount / sentences)} words/sentence`)
    setTimeout(() => { setActiveAction(null); setResult(null) }, 4000)
  }, [content, wordCount])

  const suggestions: string[] = []
  if (wordCount < 300) suggestions.push(`Aim for 600+ words for better ranking (currently ${wordCount})`)
  if (excerpt && stripHtml(excerpt).length > 200) suggestions.push('Excerpt is too long — keep under 160 chars for optimal SERP display')
  if (!excerpt || stripHtml(excerpt).length < 20) suggestions.push('Add a compelling excerpt (120-160 chars) for search snippets')
  if (title.length < 30) suggestions.push(`Title is short (${title.length} chars) — aim for 50-60`)
  if (title.length > 65) suggestions.push(`Title is long (${title.length} chars) — keep under 60`)
  if (content.includes('</p>') && !content.includes('<h2') && wordCount > 500) suggestions.push('Add subheadings (<h2>) for better structure and SEO')
  const paraCount = content.split(/<\/p>/gi).length
  if (paraCount > 0 && wordCount / paraCount > 150) suggestions.push('Some paragraphs are very long — break them into shorter chunks')

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h4 className="text-[11px] font-black uppercase tracking-[0.1em]" style={{ color: 'var(--accent)' }}>🤖 AI Assistant</h4>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Words', value: wordCount },
            { label: 'Read time', value: `${readMins} min` },
            { label: 'Pars', value: content.split(/<\/p>/gi).length || 0 },
          ].map(s => (
            <div key={s.label} className="text-center p-2 rounded-xl" style={{ background: 'var(--bg-muted)' }}>
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSmartFormat} disabled={activeAction !== null}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
            style={{ background: activeAction === 'format' ? 'var(--success)' : 'var(--bg-muted)', color: activeAction === 'format' ? '#fff' : 'var(--text-primary)' }}>
            {activeAction === 'format' ? '✓' : '📐'} Format
          </button>
          <button onClick={handleGenerateExcerpt} disabled={activeAction !== null}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
            style={{ background: activeAction === 'excerpt' ? 'var(--success)' : 'var(--bg-muted)', color: activeAction === 'excerpt' ? '#fff' : 'var(--text-primary)' }}>
            {activeAction === 'excerpt' ? '✓' : '✍'} Excerpt
          </button>
          <button onClick={handleAnalyzeReadability} disabled={activeAction !== null}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
            style={{ background: activeAction === 'readability' ? 'var(--success)' : 'var(--bg-muted)', color: activeAction === 'readability' ? '#fff' : 'var(--text-primary)' }}>
            {activeAction === 'readability' ? '✓' : '📊'} Readability
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="text-xs p-3 rounded-xl font-medium leading-relaxed animate-fade-in"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-light)' }}>
            {result}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--text-tertiary)' }}>Suggestions</p>
            <div className="space-y-1.5">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                  <span className="shrink-0 mt-px">💡</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
