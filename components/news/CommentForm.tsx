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
    <div className="mt-4 bg-gray-50 dark:bg-gray-800/40 border border-transparent dark:border-gray-700/50 rounded-xl p-4 transition-colors">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Leave a Comment</p>

      {status === 'success' && (
        <p role="status" className="text-emerald-600 dark:text-emerald-400 text-sm mb-2 font-medium">{message}</p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Share your thoughts..."
          aria-label="Comment text"
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm resize-none outline-none focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors"
        />

        {status === 'error' && (
          <p role="alert" className="text-red-500 dark:text-red-400 text-xs mt-1 mb-2">{message}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">{text.length}/2000</span>
          <button
            type="submit"
            disabled={status === 'loading' || !text.trim()}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  )
}

