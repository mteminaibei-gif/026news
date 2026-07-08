'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Admin Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <span className="text-5xl mb-4">⚠️</span>
      <h2 className="text-xl font-extrabold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-1 max-w-sm">
        An unexpected error occurred in the admin panel. Please try again.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono mb-6">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          Try again
        </button>
        <Link
          href="/admin/dashboard"
          className="border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
