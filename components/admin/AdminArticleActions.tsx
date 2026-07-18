'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Check, X, Trash2 } from 'lucide-react'

interface Props {
  articleId: number
  currentStatus?: string
}

export function AdminArticleActions({ articleId, currentStatus }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<'approve' | 'reject' | 'delete' | null>(null)

  async function handleApprove() {
    setLoading('approve')
    try {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: articleId, action: 'approve', notes: '' }),
      })
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Failed', 'error'); return }
      toast('Published!', 'success'); router.refresh()
    } catch { toast('Network error', 'error') } finally { setLoading(null) }
  }

  async function handleReject() {
    setLoading('reject')
    try {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: articleId, action: 'reject', notes: '' }),
      })
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Failed', 'error'); return }
      toast('Rejected', 'info'); router.refresh()
    } catch { toast('Network error', 'error') } finally { setLoading(null) }
  }

  async function handleDelete() {
    setLoading('delete')
    try {
      const res = await fetch(`/api/admin/articles?id=${articleId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Failed', 'error'); return }
      toast('Deleted', 'success'); router.refresh()
    } catch { toast('Network error', 'error') } finally { setLoading(null) }
  }

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px',
    border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
    color: 'var(--text-primary)', textAlign: 'left' as const, transition: 'background 0.1s',
  }

  return (
    <>
      {(currentStatus === 'under_review' || currentStatus === 'draft') && (
        <button onClick={handleApprove} disabled={loading !== null} style={itemStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <Check size={13} style={{ color: 'var(--success)' }} /> {loading === 'approve' ? '...' : 'Publish'}
        </button>
      )}
      {(currentStatus === 'under_review' || currentStatus === 'draft') && (
        <button onClick={handleReject} disabled={loading !== null} style={itemStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <X size={13} style={{ color: 'var(--warning)' }} /> {loading === 'reject' ? '...' : 'Reject'}
        </button>
      )}
      <button onClick={handleDelete} disabled={loading !== null} style={itemStyle}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
          <Trash2 size={13} style={{ color: 'var(--error)' }} /> {loading === 'delete' ? '...' : 'Delete'}
      </button>
    </>
  )
}
