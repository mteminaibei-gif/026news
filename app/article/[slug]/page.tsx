import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticleCard } from '@/components/news/ArticleCard'
import { RelatedArticles } from '@/components/news/RelatedArticles'
import { AdBanner } from '@/components/ui/AdBanner'
import { CommentsSection } from '@/components/news/CommentsSection'
import { ShareBar } from '@/components/news/ShareBar'
import { SaveArticleButton } from '@/components/news/SaveArticleButton'
import { ReadingProgress } from '@/components/ui/ReadingProgress'
import { FeaturedImage } from '@/components/ui/FeaturedImage'
import { createClient } from '@/lib/supabase/server'
import { formatDate, readingTime, formatNumber } from '@/lib/utils'
import type { Metadata } from 'next'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

const getSourceHost = (url?: string | null) => {
  if (!url) return null
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return null }
}

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
    title: string; content: string; featured_image: string | null; created_at: string
    author: { name: string } | null; category: { name: string } | null
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://026news.vercel.app'
  const description = article.content.substring(0, 155)

  return {
    title: article.title,
    description,
    keywords: [article.category?.name, article.author?.name, 'breaking news', 'journalism', '026news'].filter((k): k is string => !!k),
    authors: article.author ? [{ name: article.author.name }] : [],
    openGraph: {
      title: article.title, description, type: 'article', publishedTime: article.created_at,
      authors: article.author ? [article.author.name] : [],
      images: article.featured_image ? [{ url: article.featured_image, width: 1200, height: 630, alt: article.title }] : [],
      url: `${APP_URL}/article/${slug}`,
    },
    twitter: {
      card: 'summary_large_image', title: article.title, description,
      images: article.featured_image ? [article.featured_image] : [],
      creator: article.author ? `@${article.author.name.toLowerCase().replace(/\s+/g, '')}` : '@026news',
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: rawArticle } = await supabase
    .from('articles')
    .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
    .eq('slug', slug)
    .eq('status', 'published' as never)
    .single()

  if (!rawArticle) notFound()
  const article = rawArticle as unknown as ArticleWithAuthor

  const { data: rawComments } = await supabase
    .from('comments')
    .select('comment_id, comment_text, created_at, user:users(name,profile_image)')
    .eq('article_id', article.article_id)
    .eq('status', 'visible' as never)
    .order('created_at', { ascending: false })
    .limit(50)
  const comments = (rawComments ?? []) as unknown as CommentWithUser[]

  const { data: rawRelated } = await supabase
    .from('articles')
    .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
    .eq('status', 'published' as never)
    .neq('slug', slug)
    .limit(4)
  const related = (rawRelated ?? []) as unknown as ArticleWithAuthor[]

  const paragraphs = article.content.split('\n\n')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Navbar />
      <ReadingProgress />

      <div className="max-w-[1200px] mx-auto px-6 py-10 grid lg:grid-cols-[1fr_340px] gap-12">
        {/* Article Main */}
        <main>
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs mb-6 flex-wrap" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/" style={{ color: 'var(--primary)' }}>Home</Link>
            <span>/</span>
            <Link href={`/?category=${article.category?.name}`} style={{ color: 'var(--primary)' }}>{article.category?.name}</Link>
            <span>/</span>
            <span className="truncate max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>{article.title}</span>
          </nav>

          {/* Header */}
          <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--primary)' }}>
              {article.category?.name}
            </p>
            <h1
              className="text-2xl md:text-3xl font-semibold leading-tight mb-3"
              style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--text-primary)' }}
            >
              {article.title}
            </h1>
            <p className="text-base mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {article.content.substring(0, 140)}...
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm pb-5" style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  {article.author?.name?.charAt(0) ?? 'S'}
                </span>
                <strong style={{ color: 'var(--text-primary)' }}>{article.author?.name}</strong>
              </span>
              <span>·</span>
              <span>{formatDate(article.created_at)}</span>
              <span>·</span>
              <span>{formatNumber(article.views)} views</span>
              <span>·</span>
              <span>{readingTime(article.content)} min read</span>
            </div>

            {/* Source attribution */}
            {article.source_reference && (
              <div className="mt-5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-sm" style={{ background: 'var(--primary-light)', border: '1px solid var(--border-subtle)' }}>
                <div className="font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--primary)' }}>
                  Source attribution
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>
                  This story is linked to its original source. Click through for the full external reference.
                </p>
                <a
                  href={article.source_reference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                  style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: 'var(--bg-elevated)' }}
                >
                  {getSourceHost(article.source_reference) ?? 'Read source'} ↗
                </a>
              </div>
            )}

            {/* Author strip */}
            {article.author && (
              <div className="flex items-center gap-4 mt-5 p-4 rounded-xl" style={{ background: 'var(--bg-inset)' }}>
                {article.author.profile_image ? (
                  <Image src={article.author.profile_image} alt={article.author.name} width={48} height={48} className="rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {article.author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{article.author.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Author · {article.category?.name} Specialist</p>
                  {article.author.bio && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{article.author.bio}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Featured image */}
          {article.featured_image && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6" style={{ background: 'var(--bg-inset)' }}>
              <FeaturedImage src={article.featured_image} alt={article.title} priority sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 900px" />
            </div>
          )}

          {/* Body */}
          <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="article-content" style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.05rem', lineHeight: 1.85, color: 'var(--text-primary)' }}>
              {paragraphs.map((para, i) => (
                <p key={i} className="mb-5">{para}</p>
              ))}
            </div>
          </div>

          {/* Share bar */}
          <ShareBar title={article.title} slug={article.slug} />

          {/* Save to catalog */}
          <div className="mb-6">
            <SaveArticleButton articleId={article.article_id} slug={article.slug} />
          </div>

          {/* Comments */}
          <CommentsSection articleId={article.article_id} initialComments={comments} />

          {/* Related articles */}
          <RelatedArticles currentSlug={article.slug} categoryName={article.category?.name} />
        </main>

        {/* Sidebar */}
        <aside className="flex flex-col gap-8">
          <AdBanner slot="sidebar-article" format="rectangle" className="rounded-xl overflow-hidden" label="Sponsored" />

          {related.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Related News</h3>
              </div>
              <div className="p-3">
                {related.map(r => (
                  <ArticleCard key={r.article_id} article={r as never} variant="horizontal" />
                ))}
              </div>
            </div>
          )}

          {article.author && (
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                More by {article.author.name.split(' ')[0]}
              </h3>
              <div className="flex items-center gap-3 mb-3">
                {article.author.profile_image ? (
                  <Image src={article.author.profile_image} alt={article.author.name} width={40} height={40} className="rounded-full object-cover" unoptimized />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {article.author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{article.author.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Author</p>
                </div>
              </div>
              {article.author.bio && (
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{article.author.bio.substring(0, 100)}...</p>
              )}
              <Link
                href={`/journalists/${article.author.user_id}`}
                className="block text-center text-sm font-semibold py-2 rounded-lg transition-all no-underline"
                style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}
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
