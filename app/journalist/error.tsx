'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function JournalistError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Author Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <span className="text-5xl mb-4">⚠️</span>
      <h2 className="text-xl font-extrabold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-1 max-w-sm">
        An unexpected error occurred in the author portal. Please try again.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono mb-6">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          onClick={reset}
          className="text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          style={{ background: 'var(--primary)' }}
        >
          Try again
        </button>
        <Link
          href="/journalist/profile"
          className="font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
