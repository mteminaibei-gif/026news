import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { ReadingProgress } from '@/components/ui/ReadingProgress'
import { ViewTracker } from '@/components/ui/ViewTracker'
import { ArticleEngagement } from '@/components/news/ArticleEngagement'
import { ArticleComments } from '@/components/news/ArticleComments'
import { BannerAd, InArticleAd } from '@/components/ads/AdSense'
import { stripHtml } from '@/lib/utils'
import { sanitizeArticleHtml } from '@/lib/sanitizeHtml'
import { createClient } from '@/lib/supabase/server'
import { formatDate, readingTime, formatNumber } from '@/lib/utils'
import type { Metadata } from 'next'
import type { ArticleWithAuthor } from '@/lib/supabase/types'
import { APP_URL } from '@/lib/constants/app'

export const dynamic = 'force-dynamic'

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
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { data } = await supabase
      .from('articles')
      .select('title, excerpt, content, featured_image, created_at, tags, author:users(name), category:categories(name)')
      .eq('slug', slug)
      .single()

    if (!data) return {}
    const article = data as unknown as {
      title: string; excerpt: string | null; content: string; featured_image: string | null; created_at: string; tags: string[] | null
      author: { name: string } | null; category: { name: string } | null
    }

    const description = stripHtml((article.excerpt || article.content) ?? '').slice(0, 160)

    return {
      title: article.title,
      description,
      keywords: [article.category?.name, article.author?.name, 'breaking news', 'journalism', '026connet!']
        .filter((k): k is string => !!k)
        .concat(article.tags ?? []),
      authors: article.author ? [{ name: article.author.name }] : [],
      alternates: { canonical: `/article/${slug}` },
      robots: { index: true, follow: true },
      openGraph: {
        title: article.title,
        description,
        type: 'article',
        url: `${APP_URL}/article/${slug}`,
        siteName: '026connet!',
        locale: 'en_KE',
        publishedTime: article.created_at,
        section: article.category?.name ?? undefined,
        tags: article.tags ?? undefined,
        authors: article.author ? [article.author.name] : [],
        images: article.featured_image
          ? [{ url: article.featured_image, width: 1200, height: 630, alt: article.title }]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description,
        images: article.featured_image ? [article.featured_image] : [],
        creator: article.author ? `@${article.author.name.toLowerCase().replace(/\s+/g, '')}` : '@026connet!',
      },
    }
  } catch {
    return {}
  }
}

const ARTICLE_CSS = `
.article-view { font-family: 'Space Grotesk', system-ui, sans-serif; }
.article-view .article-layout { max-width: 780px; margin: 0 auto; padding: 48px 24px 110px; }
.article-view .article-header { margin-bottom: 40px; }
.article-view .article-category { display:inline-block; padding:5px 14px; background: var(--primary-light); color: var(--primary); font-size:0.72rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; border-radius:5px; margin-bottom:16px; }
.article-view .article-title { font-family:'Newsreader',Georgia,serif; font-size: clamp(2rem,5vw,2.8rem); font-weight:700; line-height:1.2; margin-bottom:16px; letter-spacing:-0.01em; text-wrap: balance; }
.article-view .article-subtitle { font-family:'Newsreader',Georgia,serif; font-size:1.2rem; font-style:italic; color: var(--text-secondary); line-height:1.5; margin-bottom:24px; max-width:60ch; }
.article-view .article-meta { display:flex; align-items:center; justify-content:space-between; padding:16px 0; border-top:1px solid var(--border-subtle); border-bottom:1px solid var(--border-subtle); gap:12px; flex-wrap:wrap; }
.article-view .article-author-row { display:flex; align-items:center; gap:12px; }
.article-view .author-avatar { width:44px; height:44px; border-radius:12px; background: linear-gradient(135deg, oklch(50% 0.14 220), oklch(45% 0.12 200)); display:flex; align-items:center; justify-content:center; font-size:0.85rem; font-weight:700; color: oklch(98% 0.005 175); }
.article-view .author-info { display:flex; flex-direction:column; }
.article-view .author-name { font-size:0.88rem; font-weight:600; color: var(--text-primary); }
.article-view .author-detail { font-size:0.75rem; color: var(--text-tertiary); }
.article-view .article-meta-right { display:flex; align-items:center; gap:16px; }
.article-view .meta-item { font-size:0.78rem; color: var(--text-tertiary); display:flex; align-items:center; gap:4px; }
.article-view .article-cover { width:100%; border-radius:16px; margin-bottom:40px; overflow:hidden; background: var(--bg-inset); }
.article-view .article-cover img { width:100%; height:auto; display:block; }
.article-view .article-cover-caption { text-align:center; font-size:0.75rem; color: var(--text-tertiary); font-style:italic; margin-top:10px; }
.article-view .article-body { font-family:'Newsreader',Georgia,serif; font-size:1.15rem; line-height:1.85; color: var(--text-primary); }
.article-view .article-body p { margin-bottom:1.5em; max-width:65ch; }
.article-view .article-body h2 { font-family:'Space Grotesk',system-ui,sans-serif; font-size:1.6rem; font-weight:700; margin-top:2.5em; margin-bottom:0.8em; letter-spacing:-0.01em; }
.article-view .article-body h3 { font-family:'Space Grotesk',system-ui,sans-serif; font-size:1.25rem; font-weight:600; margin-top:2em; margin-bottom:0.6em; }
.article-view .article-body blockquote { padding:20px 28px; margin:2em 0; background: var(--bg-inset); border-radius:12px; font-style:italic; color: var(--text-secondary); font-size:1.1rem; position:relative; }
.article-view .article-body blockquote::before { content:'"'; position:absolute; top:8px; left:12px; font-size:3rem; color: var(--primary); opacity:0.3; font-family:Georgia,serif; line-height:1; }
.article-view .article-body ul, .article-view .article-body ol { margin:1.5em 0; padding-left:1.5em; }
.article-view .article-body li { margin-bottom:0.6em; }
.article-view .article-body img { width:100%; border-radius:12px; margin:2em 0; }
.article-view .article-body a { color: var(--primary); text-decoration:underline; text-underline-offset:3px; }
.article-view .article-tags { display:flex; flex-wrap:wrap; gap:8px; margin-top:40px; padding-top:24px; border-top:1px solid var(--border-subtle); }
.article-view .article-tag { padding:5px 14px; background: var(--bg-inset); border-radius:16px; font-size:0.75rem; font-weight:500; color: var(--text-secondary); text-decoration:none; transition: all 0.15s; }
.article-view .article-tag:hover { background: var(--primary-light); color: var(--primary); }
.article-view .author-card { margin-top:40px; padding:28px; background: var(--bg-surface); border:1px solid var(--border-subtle); border-radius:16px; display:flex; gap:20px; align-items:flex-start; }
.article-view .author-card-avatar { width:56px; height:56px; border-radius:14px; background: linear-gradient(135deg, oklch(50% 0.14 220), oklch(45% 0.12 200)); display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:700; color: oklch(98% 0.005 175); flex-shrink:0; }
.article-view .author-card-info { flex:1; }
.article-view .author-card-name { font-size:1rem; font-weight:700; margin-bottom:4px; }
.article-view .author-card-bio { font-size:0.85rem; color: var(--text-secondary); line-height:1.5; margin-bottom:12px; }
.article-view .author-card-stats { display:flex; gap:16px; font-size:0.75rem; color: var(--text-tertiary); flex-wrap:wrap; }
.article-view .author-card-stats strong { color: var(--text-primary); font-weight:600; }
.article-view .author-card-btn { padding:9px 20px; border-radius:8px; background: var(--primary); color: oklch(98% 0.005 175); border:none; font-size:0.8rem; font-weight:600; cursor:pointer; font-family:inherit; transition: all 0.2s; flex-shrink:0; align-self:center; }
.article-view .author-card-btn:hover { background: var(--primary-hover); }
.article-view .float-bar { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background: var(--bg-elevated); border:1px solid var(--border); border-radius:16px; padding:10px 20px; display:flex; align-items:center; gap:6px; box-shadow: var(--card-hover-shadow); z-index:40; }
.article-view .float-btn { width:40px; height:40px; border-radius:10px; border:none; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color: var(--text-secondary); transition: all 0.15s; position:relative; }
.article-view .float-btn:hover { background: var(--bg-inset); color: var(--text-primary); }
.article-view .float-btn.active { color: #e23b3b; filter: drop-shadow(0 0 7px rgba(226,59,59,0.6)); }
.article-view .float-btn.active svg { fill: #e23b3b; animation: like-pop 0.28s ease; }
@keyframes like-pop { 0% { transform: scale(1); } 50% { transform: scale(1.25); } 100% { transform: scale(1); } }
.article-view .inline-bar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:14px 16px; margin:28px 0 8px; background: var(--bg-surface); border:1px solid var(--border-subtle); border-radius:14px; position:relative; }
.article-view .inline-bar .float-btn { width:auto; height:auto; padding:8px 14px; border-radius:10px; gap:6px; font-size:0.85rem; font-weight:600; }
.article-view .inline-bar .float-btn svg { width:18px; height:18px; }
.article-view .inline-bar .float-btn-count { position:static; margin-left:2px; font-size:0.78rem; }
.article-view .inline-bar .float-divider { width:1px; height:22px; background: var(--border); margin:0 4px; transform:none; }
.article-view .float-btn.saved { color: var(--accent); }
.article-view .float-btn svg { width:20px; height:20px; }
.article-view .float-btn-count { position:absolute; top:4px; right:4px; font-size:0.55rem; font-weight:700; color: var(--text-tertiary); }
.article-view .float-divider { width:1px; height:24px; background: var(--border); margin:0 6px; }
.article-view .comments-section { margin-top:48px; padding-top:40px; border-top:1px solid var(--border-subtle); }
.article-view .comments-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.article-view .comments-title { font-size:1.2rem; font-weight:700; font-family:'Space Grotesk',system-ui,sans-serif; }
.article-view .comments-count { font-size:0.82rem; color: var(--text-tertiary); }
.article-view .comment-input-wrap { display:flex; gap:12px; margin-bottom:32px; }
.article-view .comment-input-avatar { width:36px; height:36px; border-radius:10px; background: linear-gradient(135deg, oklch(50% 0.15 175), oklch(45% 0.12 220)); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; color: oklch(98% 0.005 175); flex-shrink:0; }
.article-view .comment-input-body { flex:1; }
.article-view .comment-thread { display:flex; flex-direction:column; gap:24px; }
.article-view .comment { display:flex; gap:12px; }
.article-view .comment-avatar { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; color: oklch(98% 0.005 175); flex-shrink:0; }
.article-view .comment-body { flex:1; }
.article-view .comment-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
.article-view .comment-name { font-size:0.82rem; font-weight:600; }
.article-view .comment-time { font-size:0.7rem; color: var(--text-tertiary); }
.article-view .comment-text { font-size:0.88rem; line-height:1.55; color: var(--text-secondary); margin-bottom:8px; white-space:pre-wrap; }
.article-view .comment-actions { display:flex; gap:12px; }
.article-view .comment-action { display:flex; align-items:center; gap:4px; font-size:0.72rem; color: var(--text-tertiary); cursor:pointer; background:none; border:none; font-family:inherit; transition: color 0.15s; }
.article-view .comment-action:hover { color: var(--primary); }
.article-view .comment-action svg { width:13px; height:13px; }
.article-view .related-section { margin-top:56px; padding-top:40px; border-top:1px solid var(--border-subtle); }
.article-view .related-title { font-size:1.1rem; font-weight:700; margin-bottom:24px; }
.article-view .related-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:20px; }
.article-view .related-card { border-radius:14px; overflow:hidden; background: var(--bg-surface); border:1px solid var(--border-subtle); transition: all 0.25s var(--ease-out-expo); cursor:pointer; text-decoration:none; color:inherit; display:block; }
.article-view .related-card:hover { transform: translateY(-3px); box-shadow: var(--card-hover-shadow); border-color: var(--border); }
.article-view .related-card-img { width:100%; height:140px; object-fit:cover; }
.article-view .related-card-body { padding:16px; }
.article-view .related-card-category { font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color: var(--primary); margin-bottom:6px; }
.article-view .related-card-title { font-family:'Newsreader',Georgia,serif; font-size:0.95rem; font-weight:600; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:8px; }
.article-view .related-card-meta { font-size:0.7rem; color: var(--text-tertiary); }
@media (max-width: 768px) {
  .article-view .article-layout { padding: 32px 16px 90px; }
  .article-view .article-title { font-size:1.8rem; }
  .article-view .article-body { font-size:1.05rem; }
  .article-view .article-meta { flex-direction:column; gap:12px; align-items:flex-start; }
  .article-view .related-grid { grid-template-columns: 1fr; }
  .article-view .author-card { flex-direction:column; }
  .article-view .float-bar { bottom:12px; padding:8px 16px; border-radius:14px; }
  .article-view .float-btn { width:44px; height:44px; }
  .article-view .float-btn svg { width:22px; height:22px; }
  .article-view .inline-bar { padding:12px; gap:6px; }
  .article-view .inline-bar .float-btn { padding:10px 12px; min-height:44px; }
}
`

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  let rawArticle: unknown = null
  try {
    const result = await supabase
      .from('articles')
      .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
      .eq('slug', slug)
      .eq('status', 'published' as never)
      .single()
    rawArticle = result.data
  } catch {
    notFound()
  }

  if (!rawArticle) notFound()
  const article = rawArticle as unknown as ArticleWithAuthor & {
    excerpt: string | null
    tags: string[] | null
    reading_time_minutes: number | null
    likes: number | null
    like_count: number | null
    save_count: number | null
    source_name: string | null
    source_url: string | null
  }

  const authorId = article.author?.user_id

  let comments: CommentWithUser[] = []
  let related: Array<{
    article_id: number; title: string; slug: string; featured_image: string | null
    excerpt: string | null; views: number; author: { name: string } | null; category: { name: string } | null
  }> = []
  let authorArticleCount = 0

  try {
    const [{ data: rawComments }, { data: rawRelated }, authorStats] = await Promise.all([
      supabase
        .from('comments')
        .select('comment_id, comment_text, created_at, user:users(name,profile_image)')
        .eq('article_id', article.article_id)
        .eq('status', 'visible' as never)
        .order('created_at', { ascending: false })
        .limit(50),
      article.category_id
        ? supabase
            .from('articles')
            .select('article_id, title, slug, featured_image, excerpt, views, author:users(name), category:categories(name)')
            .eq('status', 'published' as never)
            .eq('category_id', article.category_id)
            .neq('slug', slug)
            .limit(3)
        : Promise.resolve({ data: [], error: null } as any),
      authorId
        ? supabase.from('articles').select('views', { count: 'exact' }).eq('author_id', authorId).eq('status', 'published' as never)
        : Promise.resolve({ data: null, count: 0 } as any),
    ])
    comments = (rawComments ?? []) as unknown as CommentWithUser[]
    related = (rawRelated ?? []) as typeof related
    authorArticleCount = authorStats?.count ?? 0
  } catch {
    // Fallback to empty data
  }

  const readTime = article.reading_time_minutes ?? readingTime(article.content)
  const likes = article.like_count ?? article.likes ?? 0
  const authorInitials = (article.author?.name ?? 'S').split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const coverCaption = article.source_name
    ? `Source: ${article.source_name}`
    : article.featured_image
      ? 'Image via 026connet!'
      : null

  const seoDescription = stripHtml((article.excerpt || article.content) ?? '').slice(0, 160)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: seoDescription,
    image: article.featured_image ? [article.featured_image] : [],
    datePublished: article.created_at,
    dateModified: (article as unknown as { updated_at?: string }).updated_at ?? article.created_at,
    author: article.author
      ? { '@type': 'Person', name: article.author.name }
      : { '@type': 'Organization', name: '026connet!' },
    publisher: {
      '@type': 'Organization',
      name: '026connet!',
      logo: { '@type': 'ImageObject', url: `${APP_URL}/favicon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${APP_URL}/article/${article.slug}` },
    articleSection: article.category?.name ?? undefined,
    keywords: article.tags?.join(', '),
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <ReadingProgress />

      <style dangerouslySetInnerHTML={{ __html: ARTICLE_CSS }} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="article-view">
        <ViewTracker articleId={article.article_id} />
        <div className="article-layout">
          {/* Header */}
          <header className="article-header">
            {article.category?.name && <span className="article-category">{article.category.name}</span>}
            <h1 className="article-title">{article.title}</h1>
            {article.excerpt && <p className="article-subtitle">{stripHtml(article.excerpt)}</p>}

            <div className="article-meta">
              <div className="article-author-row">
                {article.author?.profile_image ? (
                  <Image src={article.author.profile_image} alt={article.author.name} width={44} height={44} className="author-avatar" style={{ borderRadius: 12, objectFit: 'cover' } as any} unoptimized />
                ) : (
                  <div className="author-avatar">{authorInitials}</div>
                )}
                <div className="author-info">
                  <span className="author-name">{article.author?.name ?? '026connet!'}</span>
                  <span className="author-detail">
                    Published {formatDate(article.created_at)} · {readTime} min read
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Cover */}
          {article.featured_image && (
            <figure className="article-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.featured_image} alt={article.title} />
              {coverCaption && <figcaption className="article-cover-caption">{coverCaption}</figcaption>}
            </figure>
          )}

          {/* Source link for aggregated articles */}
          {article.source_url && (
            <div className="mb-8 rounded-xl p-4 text-sm" style={{ background: 'var(--primary-light)', border: '1px solid var(--border-subtle)' }}>
              <span className="font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--primary)' }}>Source attribution · </span>
              <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--primary)' }}>
                {getSourceHost(article.source_url)} ↗
              </a>
            </div>
          )}

          {/* Body */}
          <div
            className="article-body rich-editor-content"
            dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content || '') }}
          />

          {/* Ad after article */}
          <BannerAd />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="article-tags">
              {article.tags.map(t => (
                <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} className="article-tag">#{t}</Link>
              ))}
            </div>
          )}

          {/* Like / Comment / Share bar — below article content */}
          <div className="my-6">
            <ArticleEngagement
              articleId={article.article_id}
              slug={article.slug}
              initialViews={article.views ?? 0}
              initialLikes={likes}
              initialComments={comments.length}
              initialSaves={article.save_count ?? 0}
            />
          </div>

          {/* Author card */}
          {article.author && (
            <div className="author-card">
              {article.author.profile_image ? (
                <Image src={article.author.profile_image} alt={article.author.name} width={56} height={56} className="author-card-avatar" style={{ borderRadius: 14, objectFit: 'cover' } as any} unoptimized />
              ) : (
                <div className="author-card-avatar">{authorInitials}</div>
              )}
              <div className="author-card-info">
                <h3 className="author-card-name">{article.author.name}</h3>
                {article.author.bio && <p className="author-card-bio">{article.author.bio}</p>}
                <div className="author-card-stats">
                  <span><strong>{formatNumber(article.views)}</strong> views on this article</span>
                  <span><strong>{authorArticleCount}</strong> articles</span>
                </div>
              </div>
              {article.author.user_id && (
                <Link href={`/journalists/${article.author.user_id}`} className="author-card-btn" style={{ textDecoration: 'none' }}>
                  View Profile
                </Link>
              )}
            </div>
          )}

          {/* Comments */}
          <section id="comments" className="comments-section">
            <ArticleComments articleId={article.article_id} initialComments={comments} />
          </section>

          {/* Related */}
          {related.length > 0 && (
            <section className="related-section">
              <h2 className="related-title">More from 026connet!</h2>
              <div className="related-grid">
                {related.map(r => (
                  <Link key={r.article_id} href={`/article/${r.slug}`} className="related-card">
                    {r.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="related-card-img" src={r.featured_image} alt={r.title} />
                    ) : (
                      <div className="related-card-img" style={{ background: 'var(--bg-inset)' }} />
                    )}
                    <div className="related-card-body">
                      {r.category?.name && <span className="related-card-category">{r.category.name}</span>}
                      <h3 className="related-card-title">{r.title}</h3>
                      <span className="related-card-meta">{r.author?.name ?? '026connet!'} · {readTime} min read</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  )
}
