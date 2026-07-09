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
          className="text-xs font-bold bg-[#1a5c2a] hover:bg-[#2d8a47] text-white px-2.5 py-1 rounded-lg transition-all duration-300 disabled:opacity-50"
        >
          {loading === 'approve' ? '…' : 'Approve'}
        </button>
      )}

      {currentStatus !== 'rejected' && (
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className="text-xs font-semibold bg-[#f5c518] hover:bg-[#e6b800] text-[#1a1a1a] px-2.5 py-1 rounded-lg transition-all duration-300 disabled:opacity-50"
        >
          {loading === 'reject' ? '…' : 'Reject'}
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={loading !== null}
        className="text-xs font-semibold bg-[#fde8e8] hover:bg-[#fbd0d0] text-[#c8102e] px-2.5 py-1 rounded-lg transition-all duration-300 disabled:opacity-50"
      >
        {loading === 'delete' ? '…' : 'Delete'}
      </button>
    </>
  )
}
