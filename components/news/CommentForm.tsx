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
    <div className="mt-4 bg-white dark:bg-[#162319] border-2 border-[#e8f5ea] dark:border-[#223d29] rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Kenya flag accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#1a5c2a] rounded-full mb-4" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-[#1a5c2a] rounded-full animate-pulse"></div>
        <p className="text-sm font-bold text-[#1a5c2a] dark:text-[#4caf28] uppercase tracking-wider">Leave a Comment</p>
      </div>

      {status === 'success' && (
        <div role="status" className="bg-[#16a34a]/10 border border-[#16a34a]/20 text-[#16a34a] dark:text-[#4ade80] text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2 font-medium">
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
          className="w-full border-2 border-[#e8f5ea] dark:border-[#223d29] rounded-xl p-4 text-sm resize-none outline-none focus:border-[#1a5c2a] dark:focus:border-[#4caf28] focus:ring-2 focus:ring-[#1a5c2a]/20 dark:focus:ring-[#4caf28]/20 bg-white dark:bg-[#0f1410] text-[#1a1a1a] dark:text-[#f8fdf5] placeholder-[#6b7280] dark:placeholder-[#81c784] transition-all duration-300 font-medium leading-relaxed"
        />

        {status === 'error' && (
          <div role="alert" className="bg-[#dc2626]/10 border border-[#dc2626]/20 text-[#dc2626] dark:text-[#ef4444] text-sm px-4 py-3 rounded-xl mt-3 mb-2 flex items-center gap-2 font-medium">
            <span className="text-base">⚠</span> {message}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#6b7280] dark:text-[#81c784] font-medium">
            {text.length}/2000 characters
          </span>
          <button
            type="submit"
            disabled={status === 'loading' || !text.trim()}
            className="bg-gradient-to-r from-[#1a5c2a] to-[#2d8a47] hover:from-[#2d8a47] hover:to-[#4caf28] disabled:from-[#6b7280] disabled:to-[#9ca3af] text-white text-sm font-bold px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1a5c2a]/20 hover:shadow-xl hover:shadow-[#1a5c2a]/30 hover:-translate-y-0.5 active:scale-95 min-w-[120px]"
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

