export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Navbar skeleton */}
      <div className="h-16 bg-white dark:bg-[#0a1628] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-9 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="hidden lg:flex gap-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}
          </div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>

      {/* Reading progress bar placeholder */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700 w-1/3" />

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_300px] gap-8 flex-1">
        <main className="animate-pulse space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />)}
          </div>

          {/* Header card */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-sm p-8 space-y-4">
            <div className="h-6 w-24 bg-blue-200 dark:bg-blue-900 rounded" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
            <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-3/5" />
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {[...Array(5)].map((_, i) => <div key={i} className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />)}
            </div>
          </div>

          {/* Featured image */}
          <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-2xl" />

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-sm p-8 space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: `${75 + (i % 3) * 8}%` }} />
            ))}
          </div>
        </main>

        <aside className="space-y-5 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-4 space-y-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              {[...Array(3)].map((_, j) => <div key={j} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />)}
            </div>
          ))}
        </aside>
      </div>

      {/* Footer stub */}
      <div className="bg-[#0a1628] h-20 mt-8" />
    </div>
  )
}
