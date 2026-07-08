'use client'

interface Props {
  title: string
  slug: string
}

export function ShareBar({ title, slug }: Props) {
  const url = typeof window !== 'undefined'
    ? window.location.href
    : `https://026news.com/article/${slug}`

  return (
    <div className="bg-white dark:bg-gray-800/60 border dark:border-gray-700/50 rounded-2xl shadow-sm p-5 mb-6 flex flex-wrap items-center gap-3 transition-colors">
      <span className="text-sm font-bold text-gray-800 dark:text-white">🔁 Share This Article</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#1877f2] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
      >
        📘 Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 bg-black text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
      >
        𝕏 Post
      </a>
      <a
        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#25d366] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
      >
        💬 WhatsApp
      </a>
      <button
        onClick={() => { navigator.clipboard.writeText(url).catch(() => {}) }}
        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        🔗 Copy Link
      </button>
    </div>
  )
}
