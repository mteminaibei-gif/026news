'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root error boundary:', error)
  }, [error])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Minimal static header */}
      <header className="bg-white dark:bg-[#0a1628] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" aria-label="026Newsblog — home">
            <Logo size="md" href="" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-5xl">
              ⚠️
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg leading-relaxed">
            We hit an unexpected error. This has been logged — please try again.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 text-left">
              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                Dev Error
              </p>
              <pre className="text-xs text-red-700 dark:text-red-300 overflow-x-auto whitespace-pre-wrap break-words">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              🔄 Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              🏠 Back to Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-[#0a1628] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} 026News. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
