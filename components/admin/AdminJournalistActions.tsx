'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: number
  currentStatus: string
}

export function AdminJournalistActions({ userId, currentStatus }: Props) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(newStatus: string) {
    const label = newStatus === 'banned' ? 'Suspend' : 'Reactivate'
    if (!confirm(`${label} this journalist?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/journalists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error ?? `${label} failed.`)
        return
      }
      router.refresh()
    } catch {
      alert('Network error. Please try again.')
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
