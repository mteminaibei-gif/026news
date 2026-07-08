import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Badge } from '@/components/ui/Badge'
import { ArticleCard } from '@/components/news/ArticleCard'
import { RelatedArticles } from '@/components/news/RelatedArticles'
import { AdBanner } from '@/components/ui/AdBanner'
import { CommentsSection } from '@/components/news/CommentsSection'
import { ShareBar } from '@/components/news/ShareBar'
import { SubscribeWidget } from '@/components/ui/SubscribeWidget'
import { ReadingProgress } from '@/components/ui/ReadingProgress'
import { createClient } from '@/lib/supabase/server'
import { formatDate, readingTime, formatNumber } from '@/lib/utils'
import type { Metadata } from 'next'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

interface Props { params: Promise<{ slug: string }> }

type CommentWithUser = {
  comment_id: number
  comment_text: string
  created_at: string
  user: { name: string; profile_image: string | null } | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('title, content, featured_image, created_at, author:users(name), category:categories(name)')
    .eq('slug', slug)
    .single()

  if (!data) return {}
  const article = data as unknown as {
    title: string
    content: string
    featured_image: string | null
    created_at: string
    author: { name: string } | null
    category: { name: string } | null
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://026news.vercel.app'
  const description = article.content.substring(0, 155)

  return {
    title: article.title,
    description,
    keywords: [article.category?.name, article.author?.name, 'breaking news', 'journalism', '026news'].filter((k): k is string => !!k),
    authors: article.author ? [{ name: article.author.name }] : [],
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      publishedTime: article.created_at,
      authors: article.author ? [article.author.name] : [],
      images: article.featured_image ? [{ url: article.featured_image, width: 1200, height: 630, alt: article.title }] : [],
      url: `${APP_URL}/article/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: article.featured_image ? [article.featured_image] : [],
      creator: article.author ? `@${article.author.name.toLowerCase().replace(/\s+/g, '')}` : '@026news',
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  // Fetch article
  const { data: rawArticle } = await supabase
    .from('articles')
    .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
    .eq('slug', slug)
    .eq('status', 'published' as never)
    .single()

  if (!rawArticle) notFound()
  const article = rawArticle as unknown as ArticleWithAuthor

  // Fetch comments
  const { data: rawComments } = await supabase
    .from('comments')
    .select('comment_id, comment_text, created_at, user:users(name,profile_image)')
    .eq('article_id', article.article_id)
    .eq('status', 'visible' as never)
    .order('created_at', { ascending: false })
    .limit(50)
  const comments = (rawComments ?? []) as unknown as CommentWithUser[]

  // Fetch related articles
  const { data: rawRelated } = await supabase
    .from('articles')
    .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
    .eq('status', 'published' as never)
    .neq('slug', slug)
    .limit(4)
  const related = (rawRelated ?? []) as unknown as ArticleWithAuthor[]

  const paragraphs = article.content.split('\n\n')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      <Navbar />
      <ReadingProgress />

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_300px] gap-8">

        {/* ── Article Main ── */}
        <main>
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 mb-5 flex-wrap">
            <Link href="/" className="text-blue-600 hover:underline">Home</Link>
            <span>/</span>
            <Link href={`/?category=${article.category?.name}`} className="text-blue-600 hover:underline">
              {article.category?.name}
            </Link>
            <span>/</span>
            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{article.title}</span>
          </nav>

          {/* Header */}
          <div className="bg-white dark:bg-gray-800/60 border dark:border-gray-700/40 rounded-2xl shadow-sm p-6 md:p-8 mb-6 transition-colors">
            <span className="inline-block bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded mb-4">
              {article.category?.name}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-3">
              {article.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base mb-4 leading-relaxed">
              {article.content.substring(0, 140)}...
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 dark:text-gray-500 pb-5 border-b border-gray-100 dark:border-gray-700/50">
              <span>✍️ <strong className="text-gray-700 dark:text-gray-300">{article.author?.name}</strong></span>
              <span>🏷️ {article.author ? (article as any).author?.role ?? 'Journalist' : 'Staff'}</span>
              <span>📅 {formatDate(article.created_at)}</span>
              <span>👁 {formatNumber(article.views)} views</span>
              <span>⏱ {readingTime(article.content)} min read</span>
              <Badge status={article.monetization_type} />
            </div>

            {/* Author strip */}
            {article.author && (
              <div className="flex items-center gap-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                {article.author.profile_image ? (
                  <Image
                    src={article.author.profile_image}
                    alt={article.author.name}
                    width={52}
                    height={52}
                    className="rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-[52px] h-[52px] rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400 shrink-0">
                    {article.author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{article.author.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Journalist · {article.category?.name} Specialist</p>
                  {article.author.bio && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">🌍 {article.author.bio}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Featured image */}
          {article.featured_image && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-sm mb-6 bg-[#e8f5ea] dark:bg-[#1a2e1e]">
              <Image
                src={article.featured_image}
                alt={article.title}
                fill
                className="object-cover"
                priority
                unoptimized
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}

          {/* Body */}
          <div className="bg-white dark:bg-gray-800/60 border dark:border-gray-700/40 rounded-2xl shadow-sm p-6 md:p-8 mb-6 transition-colors">
            <div className="article-body text-gray-700 dark:text-gray-300 text-[0.95rem]">
              {paragraphs.map((para, i) => (
                <p key={i} className="mb-5 leading-[1.85]">{para}</p>
              ))}
            </div>
          </div>

          {/* Share bar — client component */}
          <ShareBar title={article.title} slug={article.slug} />

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
          <CommentsSection articleId={article.article_id} initialComments={comments} />

          {/* Related articles */}
          <RelatedArticles currentSlug={article.slug} categoryName={article.category?.name} />
        </main>

        {/* ── Sidebar ── */}
        <aside className="space-y-5">
          {/* Subscribe widget */}
          <SubscribeWidget variant="inline" />

          {/* Ad */}
          <AdBanner slot="sidebar-article" format="rectangle" className="rounded-xl overflow-hidden" label="Sponsored" />

          {/* Related News */}
          {related.length > 0 && (
            <div className="bg-white dark:bg-gray-800/40 border dark:border-gray-700/50 rounded-xl shadow-sm overflow-hidden transition-colors">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b-2 border-blue-600">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">📰 Related News</h3>
              </div>
              <div className="p-3">
                {related.map(r => (
                  <ArticleCard key={r.article_id} article={r as never} variant="horizontal" />
                ))}
              </div>
            </div>
          )}

          {/* Author profile */}
          {article.author && (
            <div className="bg-white dark:bg-gray-800/40 border dark:border-gray-700/50 rounded-xl shadow-sm p-5 transition-colors">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                ✍️ More by {article.author.name.split(' ')[0]}
              </h3>
              <div className="flex items-center gap-3 mb-3">
                {article.author.profile_image ? (
                  <Image src={article.author.profile_image} alt={article.author.name} width={48} height={48} className="rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400">
                    {article.author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{article.author.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Journalist</p>
                </div>
              </div>
              {article.author.bio && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{article.author.bio.substring(0, 100)}...</p>
              )}
              <Link
                href={`/journalists/${article.author.user_id}`}
                className="mt-3 block text-center border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white text-sm font-semibold py-2 rounded-lg transition-colors"
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
