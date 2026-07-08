export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar skeleton */}
      <div className="h-16 bg-white dark:bg-[#0a1628] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-9 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="hidden lg:flex gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>

      {/* Category bar skeleton */}
      <div className="bg-white dark:bg-[#0a1628] border-b border-gray-200 dark:border-gray-800 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 flex gap-2 py-3 overflow-x-auto">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded shrink-0" />
          ))}
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="relative bg-[#0a1628] overflow-hidden min-h-[420px] animate-pulse">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="max-w-xl space-y-4">
            <div className="h-7 w-32 bg-white/20 rounded-full" />
            <div className="h-12 w-full bg-white/20 rounded" />
            <div className="h-8 w-4/5 bg-white/15 rounded" />
            <div className="h-5 w-3/5 bg-white/10 rounded" />
            <div className="flex gap-3 pt-2">
              <div className="h-12 w-40 bg-orange-500/30 rounded-xl" />
              <div className="h-12 w-32 bg-white/15 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_300px] gap-8 w-full">
        <div className="space-y-5">
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-40 h-28 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-4 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-3 last:mb-0" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
