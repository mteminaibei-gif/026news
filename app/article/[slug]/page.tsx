import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Badge } from '@/components/ui/Badge'
import { ArticleCard } from '@/components/news/ArticleCard'
import { RelatedArticles } from '@/components/news/RelatedArticles'
import { AdBanner } from '@/components/ui/AdBanner'
import { MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import { formatDate, readingTime, formatNumber } from '@/lib/utils'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = MOCK_ARTICLES.find(a => a.slug === slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.content.substring(0, 155),
    openGraph: { images: [article.featured_image ?? ''] },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = MOCK_ARTICLES.find(a => a.slug === slug)
  if (!article) notFound()

  const author = MOCK_USERS.find(u => u.user_id === article.author_id)
  const related = MOCK_ARTICLES.filter(
    a => a.category?.name === article.category?.name && a.article_id !== article.article_id && a.status === 'published'
  ).slice(0, 4)

  const paragraphs = article.content.split('\n\n')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_300px] gap-8">

        {/* ── Article Main ── */}
        <main>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5 flex-wrap">
            <Link href="/" className="text-blue-600 hover:underline">Home</Link>
            <span>/</span>
            <Link href={`/?category=${article.category?.name}`} className="text-blue-600 hover:underline">
              {article.category?.name}
            </Link>
            <span>/</span>
            <span className="text-gray-600 truncate max-w-[200px]">{article.title}</span>
          </nav>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
            <span className="inline-block bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded mb-4">
              {article.category?.name}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
              {article.title}
            </h1>
            <p className="text-gray-500 text-base mb-4 leading-relaxed">
              {article.content.substring(0, 140)}...
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 pb-5 border-b border-gray-100">
              <span>✍️ <strong className="text-gray-700">{author?.name}</strong></span>
              <span>🏷️ Freelance Journalist</span>
              <span>📅 {formatDate(article.created_at)}</span>
              <span>👁 {formatNumber(article.views)} views</span>
              <span>⏱ {readingTime(article.content)} min read</span>
              <Badge status={article.monetization_type} />
            </div>

            {/* Author strip */}
            {author && (
              <div className="flex items-center gap-4 mt-4 p-4 bg-gray-50 rounded-xl">
                <Image
                  src={author.profile_image ?? ''}
                  alt={author.name}
                  width={52}
                  height={52}
                  className="rounded-full object-cover shrink-0"
                />
                <div>
                  <p className="font-bold text-gray-900">{author.name}</p>
                  <p className="text-xs text-gray-400">Freelance Journalist · {article.category?.name} Specialist</p>
                  <p className="text-sm text-gray-500 mt-0.5">🌍 {author.bio}</p>
                </div>
              </div>
            )}
          </div>

          {/* Featured image */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-sm mb-6">
            <Image
              src={article.featured_image ?? ''}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Body */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
            <div className="article-body text-gray-700 text-[0.95rem]">
              {paragraphs.map((para, i) => (
                <p key={i} className="mb-5 leading-[1.85]">{para}</p>
              ))}
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs font-semibold text-gray-400">Tags:</span>
                {article.tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/?tag=${tag}`}
                    className="bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white text-xs font-semibold px-3 py-1 rounded-full transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Share bar */}
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-800">🔁 Share This Article</span>
            <button className="flex items-center gap-2 bg-[#1877f2] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">
              📘 Facebook
            </button>
            <button className="flex items-center gap-2 bg-[#1da1f2] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">
              🐦 Twitter
            </button>
            <button className="flex items-center gap-2 bg-[#25d366] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">
              💬 WhatsApp
            </button>
          </div>

          {/* Sources */}
          {article.sources.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-xl p-5 mb-6">
              <h4 className="font-bold text-gray-900 mb-3">📎 Sources &amp; References</h4>
              <ul className="space-y-1.5">
                {article.sources.map((src, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <span>🔗</span>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {src.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Support / Monetization */}
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors">
              ☕ Buy Me a Coffee
            </button>
            <button className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors">
              🎬 Become a Patron
            </button>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">💬 {article.comments.length} Comments</h3>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button className="text-sm font-semibold px-3 py-1.5 rounded-md bg-white text-blue-600 shadow-sm">Top</button>
                <button className="text-sm font-semibold px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-800">Newest</button>
              </div>
            </div>

            {article.comments.map(comment => (
              <div key={comment.id} className="flex gap-3 mb-5 pb-5 border-b border-gray-100 last:border-0">
                <Image src={comment.avatar} alt={comment.author} width={38} height={38} className="rounded-full object-cover shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{comment.author}</span>
                    <span className="text-xs text-gray-400">{comment.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{comment.text}</p>
                  <div className="flex gap-4 mt-2">
                    <button className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">👍 {comment.likes}</button>
                    <button className="text-xs text-gray-400 hover:text-blue-600">↩️ Reply</button>
                    <button className="text-xs text-gray-400 hover:text-red-500">🚩 Report</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Comment form */}
            <div className="mt-4 bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">Leave a Comment</p>
              <textarea
                rows={3}
                placeholder="Share your thoughts..."
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none outline-none focus:border-blue-500"
              />
              <div className="flex justify-end mt-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Post Comment
                </button>
              </div>
            </div>
          </div>
          {/* Related articles - AI recommendations */}
          <RelatedArticles currentSlug={article.slug} categoryName={article.category?.name} />
        </main>

        {/* ── Sidebar ── */}
        <aside className="space-y-5">
          {/* Subscribe */}
          <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] rounded-xl p-5 text-white text-center">
            <h4 className="font-bold mb-1">Subscribe for Full Access</h4>
            <p className="text-white/60 text-sm mb-3">Unlimited access to premium content.</p>
            <Link href="/subscribe" className="block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
              Subscribe Now
            </Link>
          </div>

          {/* Ad */}
          <AdBanner slot="sidebar-article" format="rectangle" className="rounded-xl overflow-hidden" label="Sponsored" />

          {/* Related News */}
          {related.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b-2 border-blue-600">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">📰 Related News</h3>
              </div>
              <div className="p-3">
                {related.map(r => (
                  <ArticleCard key={r.article_id} article={r} variant="horizontal" />
                ))}
              </div>
            </div>
          )}

          {/* Author profile */}
          {author && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-3">
                ✍️ More by {author.name.split(' ')[0]}
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <Image src={author.profile_image ?? ''} alt={author.name} width={48} height={48} className="rounded-full object-cover" />
                <div>
                  <p className="font-bold text-sm text-gray-900">{author.name}</p>
                  <p className="text-xs text-gray-400">Freelance Journalist</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{author.bio?.substring(0, 100)}...</p>
              <Link
                href={`/journalists/${author.user_id}`}
                className="mt-3 block text-center border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                View Profile
              </Link>
            </div>
          )}
        </aside>
      </div>

      <Footer />
    </div>
  )
}
