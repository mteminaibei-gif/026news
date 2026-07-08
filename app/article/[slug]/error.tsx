'use client'

import Link from 'next/link'

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="h-16 bg-white dark:bg-[#0a1628] border-b border-gray-200 dark:border-gray-800" />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8 flex justify-center text-6xl">⚠️</div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
            Failed to load article
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            The article could not be loaded. This may be a temporary issue.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              🔄 Try Again
            </button>
            <Link
              href="/"
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              🏠 Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
