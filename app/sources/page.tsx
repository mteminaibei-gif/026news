import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'
import { Eye, TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'Explore — 026Newsblog' }
export const dynamic = 'force-dynamic'

const CAT_COLORS = [
  'oklch(92% 0.04 200)', 'oklch(92% 0.04 55)', 'oklch(92% 0.04 145)',
  'oklch(92% 0.04 310)', 'oklch(92% 0.04 25)', 'oklch(92% 0.04 80)',
  'oklch(92% 0.04 175)', 'oklch(92% 0.04 260)',
]

export default async function ExplorePage() {
  const supabase = await createClient()

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('category_id, name, slug, icon')
    .order('name')
    .limit(20)

  const cats = (categories ?? []) as unknown as { category_id: number; name: string; slug: string; icon: string | null }[]

  // For each category, fetch up to 4 articles (parallel)
  const categoryArticles = await Promise.all(
    cats.map(async (cat) => {
      const { data } = await supabase
        .from('articles')
        .select('article_id, title, slug, excerpt, featured_image, views, tags, author:users(name)')
        .eq('status', 'published')
        .eq('category_id', cat.category_id)
        .order('views', { ascending: false })
        .limit(4)
      return { category: cat, articles: (data ?? []) as unknown as Array<{
        article_id: number; title: string; slug: string; excerpt: string | null
        featured_image: string | null; views: number | null; tags: string[] | null
        author: { name: string } | null
      }> }
    })
  )

  // Only show categories that have articles
  const populatedCategories = categoryArticles.filter(ca => ca.articles.length > 0)

  // Fetch trending tags (top tags from published articles)
  const { data: trendingArticles } = await supabase
    .from('articles')
    .select('tags')
    .eq('status', 'published')
    .not('tags', 'is', null)
    .order('views', { ascending: false })
    .limit(50)

  const tagCounts = new Map<string, number>()
  for (const article of (trendingArticles ?? []) as unknown as { tags: string[] | null }[]) {
    if (article.tags) {
      for (const tag of article.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
      }
    }
  }
  const trendingTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag, count]) => ({ tag, count }))

  // Fetch top viewed articles for "Trending Now"
  const { data: trendingArticlesList } = await supabase
    .from('articles')
    .select('article_id, title, slug, featured_image, views, category:categories(name), author:users(name)')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(5)

  const trendingList = (trendingArticlesList ?? []) as unknown as Array<{
    article_id: number; title: string; slug: string; featured_image: string | null
    views: number | null
    category: { name: string } | null; author: { name: string } | null
  }>

  // Fetch recent articles
  const { data: recentArticles } = await supabase
    .from('articles')
    .select('article_id, title, slug, excerpt, featured_image, views, category:categories(name), author:users(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6)

  const recentList = (recentArticles ?? []) as unknown as Array<{
    article_id: number; title: string; slug: string; excerpt: string | null
    featured_image: string | null; views: number | null
    category: { name: string } | null; author: { name: string } | null
  }>

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        {/* Search hero */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 40px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            Explore stories
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 28 }}>Search articles, topics, and authors across 026Newsblog</p>

          <form action="/search" method="get" style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
            <input
              name="q"
              type="search"
              placeholder="Search for articles, topics, or authors..."
              style={{ width: '100%', padding: '16px 20px 16px 52px', borderRadius: 14, border: '2px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit', outline: 'none' }}
            />
            <button type="submit" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'oklch(98% 0.005 175)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              Search
            </button>
          </form>
        </section>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px' }}>
          {/* Trending Tags */}
          {trendingTags.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Trending Topics</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {trendingTags.map(({ tag, count }) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 20,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}
                  >
                    <span>{tag}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', background: 'var(--bg-muted)', padding: '1px 6px', borderRadius: 8 }}>{count}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Categories with articles */}
          {populatedCategories.map(({ category, articles }, i) => (
            <section key={category.category_id} style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Link href={`/category/${category.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: CAT_COLORS[i % CAT_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{category.icon || '📰'}</span>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{category.name}</h2>
                </Link>
                <Link href={`/category/${category.slug}`} style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {articles.map((article) => (
                  <Link
                    key={article.article_id}
                    href={`/article/${article.slug}`}
                    style={{
                      borderRadius: 12, overflow: 'hidden',
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      textDecoration: 'none', color: 'inherit',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                  >
                    {article.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={article.featured_image} alt="" style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: 120, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    )}
                    <div style={{ padding: 16 }}>
                      <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.35, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-primary)' }}>
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {article.excerpt}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        <span>{article.author?.name ?? '026Newsblog'}</span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {formatNumber(article.views ?? 0)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {/* Trending Now */}
          {trendingList.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Trending Now</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {trendingList.map((a, i) => (
                  <Link
                    key={a.article_id}
                    href={`/article/${a.slug}`}
                    style={{
                      display: 'flex', gap: 16, alignItems: 'center',
                      padding: 14, borderRadius: 12,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      textDecoration: 'none', color: 'inherit',
                    }}
                  >
                    <span style={{ minWidth: 28, height: 28, borderRadius: 8, background: 'var(--primary)', color: 'oklch(98% 0.005 175)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', marginBottom: 4 }}>{a.category?.name ?? 'Story'}</div>
                      <h4 style={{ fontFamily: "'Newsreader', serif", fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-primary)' }}>{a.title}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{a.author?.name ?? '026Newsblog'} · {formatNumber(a.views ?? 0)} views</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent Articles */}
          {recentList.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recently Published</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {recentList.map((a) => (
                  <Link
                    key={a.article_id}
                    href={`/article/${a.slug}`}
                    style={{
                      borderRadius: 12, overflow: 'hidden',
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      textDecoration: 'none', color: 'inherit',
                    }}
                  >
                    {a.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.featured_image} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: 100, background: 'var(--bg-muted)' }} />
                    )}
                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', marginBottom: 6 }}>{a.category?.name ?? 'Story'}</div>
                      <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.35, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-primary)' }}>
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {a.excerpt}
                        </p>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        {a.author?.name ?? '026Newsblog'} · {formatNumber(a.views ?? 0)} views
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
