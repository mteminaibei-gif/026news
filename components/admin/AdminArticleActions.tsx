'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  articleId: number
  /** Used to conditionally show approve/reject buttons */
  currentStatus?: string
}

export function AdminArticleActions({ articleId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | 'delete' | null>(null)

  async function handleApprove() {
    if (!confirm('Approve and publish this article?')) return
    setLoading('approve')
    try {
      const res = await fetch('/api/articles/review', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: articleId, action: 'approve', notes: '' }),
      })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error ?? 'Approve failed.')
        return
      }
      router.refresh()
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleReject() {
    if (!confirm('Reject this article? The author will be notified.')) return
    setLoading('reject')
    try {
      const res = await fetch('/api/articles/review', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: articleId, action: 'reject', notes: '' }),
      })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error ?? 'Reject failed.')
        return
      }
      router.refresh()
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    if (!confirm('Permanently delete this article? This cannot be undone.')) return
    setLoading('delete')
    try {
      const res = await fetch(`/api/admin/articles?id=${articleId}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error ?? 'Delete failed.')
        return
      }
      router.refresh()
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* Approve — show for under_review and draft */}
      {(currentStatus === 'under_review' || currentStatus === 'draft') && (
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="text-xs font-bold text-white px-2.5 py-1 rounded-lg transition-all duration-300 disabled:opacity-50"
          style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}
        >
          {loading === 'approve' ? '…' : 'Approve'}
        </button>
      )}

      {/* Reject — only for articles under review or draft */}
      {(currentStatus === 'under_review' || currentStatus === 'draft') && (
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300 disabled:opacity-50"
          style={{ background: 'var(--warning)', color: 'var(--text-primary)' }}
        >
          {loading === 'reject' ? '…' : 'Reject'}
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={loading !== null}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300 disabled:opacity-50"
          style={{ background: 'var(--error-light)', color: 'var(--error)' }}
      >
        {loading === 'delete' ? '…' : 'Delete'}
      </button>
    </>
  )
}
