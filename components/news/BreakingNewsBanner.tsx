'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRealtime } from '@/components/providers/RealtimeProvider'

export function BreakingNewsBanner() {
  const { breakingNews, clearBreakingNews } = useRealtime()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (breakingNews) {
      setVisible(true)
      // Auto-dismiss after 15 seconds
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(clearBreakingNews, 300)
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [breakingNews, clearBreakingNews])

  if (!breakingNews || !visible) return null

  return (
    <div
      className="sticky top-16 z-40 transition-all duration-300"
      style={{
        background: 'linear-gradient(90deg, #e23b3b, #c62828)',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
        <span
          className="shrink-0 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded"
          style={{ background: 'rgba(255,255,255,0.2)', animation: 'pulse 2s infinite' }}
        >
          Breaking
        </span>
        <Link
          href={`/article/${breakingNews.slug}`}
          className="text-sm font-semibold truncate hover:underline flex-1"
          style={{ color: '#fff' }}
        >
          {breakingNews.title}
        </Link>
        <button
          onClick={() => { setVisible(false); setTimeout(clearBreakingNews, 300) }}
          className="shrink-0 text-xs font-bold px-2 py-1 rounded transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)' }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
