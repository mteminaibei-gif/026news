'use client'

import { useState } from 'react'

interface Props {
  articleId: number
  onCommentPosted?: (comment: any) => void
}

export function CommentForm({ articleId, onCommentPosted }: Props) {
  const [text, setText]     = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, comment_text: trimmed }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        // 401 means not signed in — give a helpful message
        setMessage(
          res.status === 401
            ? 'Please sign in to leave a comment.'
            : (data.error ?? 'Could not post comment. Please try again.')
        )
        return
      }

      setStatus('success')
      setMessage('Comment posted!')
      setText('')
      onCommentPosted?.(data)

      // Reset success state after 3 s
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <div className="mt-4 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '2px solid var(--border-subtle)' }}>
      {/* Kenya flag accent */}
      <div className="h-1 w-full rounded-full mb-4" style={{ background: 'linear-gradient(to right, var(--error), var(--text-primary), var(--primary))' }} />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--primary)' }}></div>
        <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Leave a Comment</p>
      </div>

      {status === 'success' && (
        <div role="status" className="text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2 font-medium" style={{ background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.2)', color: 'var(--success)' }}>
          <span className="text-base">✓</span> {message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Share your thoughts about this news story..."
          aria-label="Comment text"
          className="w-full border-2 rounded-xl p-4 text-sm resize-none outline-none focus:ring-2 transition-all duration-300 font-medium leading-relaxed"
          style={{
            borderColor: 'var(--border-subtle)',
            background: 'var(--bg-base)',
            color: 'var(--text-primary)',
            ['--tw-ring-color' as string]: 'var(--primary)',
          }}
        />

        {status === 'error' && (
          <div role="alert" className="text-sm px-4 py-3 rounded-xl mt-3 mb-2 flex items-center gap-2 font-medium" style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', color: 'var(--error)' }}>
            <span className="text-base">⚠</span> {message}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {text.length}/2000 characters
          </span>
          <button
            type="submit"
            disabled={status === 'loading' || !text.trim()}
            className="text-white text-sm font-bold px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 min-w-[120px]"
            style={{
              background: 'linear-gradient(to right, var(--primary), var(--primary-hover))',
            }}
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Posting...
              </span>
            ) : (
              'Post Comment'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

