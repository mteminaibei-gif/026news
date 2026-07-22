'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { safeRefresh } from '@/lib/utils'

interface Props {
  userId: number
  currentStatus: string
}

export function AdminJournalistActions({ userId, currentStatus }: Props) {
  const router  = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(newStatus: string) {
    const label = newStatus === 'banned' ? 'Suspend' : 'Reactivate'
    if (!confirm(`${label} this author?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/journalists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast(d.error ?? `${label} failed.`, 'error')
        return
      }
      toast(`Author ${newStatus === 'banned' ? 'suspended' : 'reactivated'}.`, 'success')
      safeRefresh(router)
    } catch {
      toast('Network error. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'banned') {
    return (
      <button
        onClick={() => handleStatusChange('active')}
        disabled={loading}
        className="text-xs font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-600 disabled:opacity-50"
      >
        {loading ? '…' : 'Reactivate'}
      </button>
    )
  }

  return (
    <button
      onClick={() => handleStatusChange('banned')}
      disabled={loading}
      className="text-xs font-bold bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50"
    >
      {loading ? '…' : 'Suspend'}
    </button>
  )
}
