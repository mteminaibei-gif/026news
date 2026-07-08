import Link from 'next/link'
import Image from 'next/image'

const CATEGORIES = [
  { name: 'Politics',      emoji: '🏛️', href: '/?category=Politics' },
  { name: 'Business',      emoji: '💼', href: '/?category=Business' },
  { name: 'Tech',          emoji: '💻', href: '/?category=Tech' },
  { name: 'Science',       emoji: '🔬', href: '/?category=Science' },
  { name: 'Sports',        emoji: '⚽', href: '/?category=Sports' },
  { name: 'Entertainment', emoji: '🎬', href: '/?category=Entertainment' },
  { name: 'Kenya',         emoji: '🇰🇪', href: '/?category=Kenya' },
  { name: 'Africa',        emoji: '🌍', href: '/?category=Africa' },
]

export default function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Minimal static header — no client hooks */}
      <header className="bg-white dark:bg-[#0a1628] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="026News — go to homepage" className="flex items-center">
            <Image src="/026newslogo.png" alt="026NEW Blog" width={140} height={44} className="h-20 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors"
            >
              🔍 Search
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">

          {/* 404 number */}
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500 mb-6 select-none">
            404
          </h1>

          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
            The article or page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              🏠 Back to Home
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              🔍 Search News
            </Link>
          </div>

          {/* Category grid */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border dark:border-gray-700 p-6">
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              📂 Browse by Category
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 dark:bg-gray-700/60 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium transition-colors text-sm"
                >
                  <span>{cat.emoji}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Minimal footer */}
      <footer className="bg-[#0a1628] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} 026News · All rights reserved · Built in Africa 🌍
        </div>
      </footer>
    </div>
  )
}
