import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticleCard } from '@/components/news/ArticleCard'
import { formatDate, formatNumber } from '@/lib/utils'
import { MOCK_ARTICLES, MOCK_CATEGORIES, MOCK_USERS } from '@/lib/mock-data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Breaking News, Analysis & Freelance Journalism',
}

export default function HomePage() {
  const published = MOCK_ARTICLES.filter(a => a.status === 'published')
  const featured = published.filter(a => a.featured)
  const trending = [...published].sort((a, b) => b.views - a.views).slice(0, 5)
  const freelanceSpotlight = published.slice(0, 3)
  const journalists = MOCK_USERS.filter(u => u.role === 'journalist')

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Category bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-0 scrollbar-none">
          <Link href="/" className="px-4 py-2.5 text-sm font-semibold text-blue-600 border-b-2 border-blue-600 whitespace-nowrap shrink-0">
            All News
          </Link>
          {MOCK_CATEGORIES.map(cat => (
            <Link
              key={cat.category_id}
              href={`/?category=${cat.name}`}
              className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors whitespace-nowrap shrink-0"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Breaking news ticker */}
      <div className="bg-[#0a1628] text-white py-2 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 text-sm">
          <span className="bg-orange-500 text-white px-2.5 py-0.5 rounded text-xs font-bold uppercase shrink-0">
            ⚡ Breaking
          </span>
          <div className="flex gap-8 overflow-hidden whitespace-nowrap text-white/70">
            <span className="before:content-['•_'] before:text-orange-400">New Exoplanet Discovered in Habitable Zone</span>
            <span className="before:content-['•_'] before:text-orange-400">Solar Technology Breakthrough at MIT</span>
            <span className="before:content-['•_'] before:text-orange-400">Global Markets Rally on Fed Decision</span>
            <span className="before:content-['•_'] before:text-orange-400">Eastern Europe Tensions — Diplomatic Talks Planned</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      {featured[0] && (
        <section className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] text-white">
          <div className="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-orange-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded mb-4">
                🔴 Featured Story
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4 text-white">
                {featured[0].title}
              </h1>
              <p className="text-white/65 text-base mb-5 leading-relaxed">
                {featured[0].content.substring(0, 160)}...
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/50 mb-6">
                <span>✍️ {featured[0].author?.name}</span>
                <span>📅 {formatDate(featured[0].created_at)}</span>
                <span>👁 {formatNumber(featured[0].views)} views</span>
                <span className="bg-blue-800/50 text-blue-200 px-2 py-0.5 rounded-full text-xs font-medium">
                  {featured[0].category?.name}
                </span>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/article/${featured[0].slug}`}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  Read Full Story
                </Link>
                <Link
                  href="/"
                  className="border border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  More Stories
                </Link>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video">
              <Image
                src={featured[0].featured_image ?? ''}
                alt={featured[0].title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_300px] gap-8 w-full">

        {/* Feed */}
        <main>
          <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2 after:flex-1 after:h-0.5 after:bg-gray-200 after:ml-2">
            📰 Latest News
          </h2>
          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {published.map(article => (
              <ArticleCard key={article.article_id} article={article} />
            ))}
          </div>

          {/* Freelance Spotlight */}
          <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2 after:flex-1 after:h-0.5 after:bg-gray-200 after:ml-2">
            ✍️ Freelance Spotlight
          </h2>
          <div className="space-y-4">
            {freelanceSpotlight.map(article => {
              const auth = MOCK_USERS.find(u => u.user_id === article.author_id)
              return (
                <div key={article.article_id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-start hover:shadow-md transition-shadow">
                  <div className="relative w-24 h-20 shrink-0 rounded-lg overflow-hidden">
                    <Image src={article.featured_image ?? ''} alt={article.title} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase text-orange-500 tracking-wider">{article.category?.name}</span>
                    <h4 className="font-bold text-gray-900 mt-0.5 mb-1.5 leading-snug">
                      <Link href={`/article/${article.slug}`} className="hover:text-blue-600">{article.title}</Link>
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{article.content.substring(0, 100)}...</p>
                    {auth && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Image src={auth.profile_image ?? ''} alt={auth.name} width={20} height={20} className="rounded-full object-cover" />
                        <span className="text-xs text-gray-400">{auth.name} — Freelance Journalist</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Trending */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b-2 border-blue-600">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">🔥 Trending Now</h3>
            </div>
            {trending.map((a, i) => (
              <div key={a.article_id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
                <span className="text-2xl font-black text-gray-200 min-w-[28px]">{i + 1}</span>
                <div>
                  <h5 className="text-sm font-semibold text-gray-800 leading-snug">
                    <Link href={`/article/${a.slug}`} className="hover:text-blue-600">{a.title}</Link>
                  </h5>
                  <p className="text-xs text-gray-400 mt-0.5">👁 {formatNumber(a.views)} · {a.category?.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Subscribe widget */}
          <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] rounded-xl p-5 text-center text-white">
            <h4 className="font-bold mb-1">Subscribe for Full Access</h4>
            <p className="text-white/60 text-sm mb-4">Unlimited access to premium freelance journalism.</p>
            <input
              type="email"
              placeholder="Your email address"
              className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 mb-2 outline-none"
            />
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
              Subscribe Now
            </button>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b-2 border-blue-600">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">📂 Categories</h3>
            </div>
            {MOCK_CATEGORIES.map(cat => (
              <div key={cat.category_id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-0">
                <div>
                  <Link href={`/?category=${cat.name}`} className="text-sm font-semibold text-gray-800 hover:text-blue-600">{cat.name}</Link>
                  <p className="text-xs text-gray-400">{published.filter(a => a.category?.name === cat.name).length} articles</p>
                </div>
                <span className="text-gray-300">→</span>
              </div>
            ))}
          </div>

          {/* Top Journalists */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b-2 border-blue-600">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">🏆 Top Journalists</h3>
            </div>
            {journalists.slice(0, 3).map(j => (
              <div key={j.user_id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
                <Image src={j.profile_image ?? ''} alt={j.name} width={36} height={36} className="rounded-full object-cover shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{j.name}</p>
                  <p className="text-xs text-gray-400">{j.articles} articles</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  )
}
