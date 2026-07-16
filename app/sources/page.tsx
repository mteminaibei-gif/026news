import type { Metadata } from 'next'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'
import { Eye, TrendingUp, Search, ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Explore — 026Newsblog' }
export const dynamic = 'force-dynamic'

const CAT_COLORS: Array<{ bg: string; stroke: string }> = [
  { bg: 'oklch(92% 0.04 200)', stroke: 'oklch(45% 0.12 200)' },
  { bg: 'oklch(92% 0.04 55)', stroke: 'oklch(55% 0.15 55)' },
  { bg: 'oklch(92% 0.04 145)', stroke: 'oklch(45% 0.12 145)' },
  { bg: 'oklch(92% 0.04 310)', stroke: 'oklch(50% 0.14 310)' },
  { bg: 'oklch(92% 0.04 25)', stroke: 'oklch(50% 0.14 25)' },
  { bg: 'oklch(92% 0.04 80)', stroke: 'oklch(55% 0.12 80)' },
  { bg: 'oklch(92% 0.04 175)', stroke: 'oklch(45% 0.12 175)' },
  { bg: 'oklch(92% 0.04 260)', stroke: 'oklch(50% 0.14 260)' },
]

const CAT_ICONS: Record<string, string> = {
  Politics: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  Business: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  Tech: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  Science: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  Sports: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  Entertainment: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  Health: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  Kenya: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  Africa: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  World: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  Lifestyle: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  Opinion: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  Education: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
}

export default async function ExplorePage() {
  const supabase = await createClient()

  // Fetch categories with article counts
  const { data: categories } = await supabase
    .from('categories')
    .select('category_id, name, slug, icon')
    .order('name')
    .limit(20)

  const cats = (categories ?? []) as unknown as { category_id: number; name: string; slug: string; icon: string | null }[]

  // Get article counts per category
  const categoryCounts = await Promise.all(
    cats.map(async (cat) => {
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('category_id', cat.category_id)
      return { ...cat, count: count ?? 0 }
    })
  )

  // Top viewed articles for trending
  const { data: trendingArticles } = await supabase
    .from('articles')
    .select('article_id, title, slug, featured_image, views, created_at, category:categories(name), author:users(name)')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(5)

  const trendingList = (trendingArticles ?? []) as unknown as Array<{
    article_id: number; title: string; slug: string; featured_image: string | null
    views: number | null; created_at: string
    category: { name: string } | null; author: { name: string } | null
  }>

  // Editor's picks (featured or high-view articles)
  const { data: featured } = await supabase
    .from('articles')
    .select('article_id, title, slug, excerpt, featured_image, views, category:categories(name), author:users(name)')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(4)

  const picks = (featured ?? []) as unknown as Array<{
    article_id: number; title: string; slug: string; excerpt: string | null
    featured_image: string | null; views: number | null
    category: { name: string } | null; author: { name: string } | null
  }>

  const hero = picks[0]
  const side = picks.slice(1, 4)

  // Journalists
  const { data: journalists } = await supabase
    .from('users')
    .select('user_id, name, profile_image, role')
    .eq('role', 'journalist')
    .limit(6)

  const authors = (journalists ?? []) as unknown as Array<{
    user_id: number; name: string; profile_image: string | null; role: string
  }>

  // Trending tags
  const { data: trendingArticlesForTags } = await supabase
    .from('articles')
    .select('tags')
    .eq('status', 'published')
    .not('tags', 'is', null)
    .order('views', { ascending: false })
    .limit(50)

  const tagCounts = new Map<string, number>()
  for (const article of (trendingArticlesForTags ?? []) as unknown as { tags: string[] | null }[]) {
    if (article.tags) {
      for (const tag of article.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
      }
    }
  }
  const trendingTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }))

  return (
    <>
      <main style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        {/* Search Hero */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 40px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
            Explore stories
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 32 }}>
            Search articles, topics, and authors across 026Newsblog
          </p>

          <form action="/search" method="get" style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
              <Search size={20} />
            </span>
            <input
              name="q"
              type="search"
              placeholder="Search for articles, topics, or authors..."
              style={{
                width: '100%', padding: '16px 20px 16px 52px',
                borderRadius: 14, border: '2px solid var(--border)',
                background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button type="submit" style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: 'var(--primary)', color: 'oklch(98% 0.005 175)',
              fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Search
            </button>
          </form>

          {/* Trending tags */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Trending:</span>
            {trendingTags.map(({ tag }) => (
              <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} style={{
                padding: '5px 12px', background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)', borderRadius: 16,
                fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)',
                textDecoration: 'none', transition: 'all 0.15s',
              }}>
                {tag}
              </Link>
            ))}
          </div>
        </section>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px' }}>

          {/* Categories Carousel */}
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Browse by Category</h2>
              <Link href="/news" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View all &rarr;</Link>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
              {categoryCounts.map((c, i) => (
                <Link key={c.category_id} href={`/category/${c.slug}`} style={{
                  minWidth: 180, padding: 20,
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  borderRadius: 14, textDecoration: 'none', color: 'inherit',
                  scrollSnapAlign: 'start', flexShrink: 0, transition: 'all 0.25s',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: CAT_COLORS[i % CAT_COLORS.length].bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={CAT_COLORS[i % CAT_COLORS.length].stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                      dangerouslySetInnerHTML={{ __html: CAT_ICONS[c.name] || '<circle cx="12" cy="12" r="10"/>' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{c.count} articles</div>
                </Link>
              ))}
            </div>
          </section>

          {/* Trending Topics */}
          {trendingList.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Trending Topics</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {trendingList.map((a, i) => (
                  <Link key={a.article_id} href={`/article/${a.slug}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 18px', background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)', borderRadius: 12,
                    textDecoration: 'none', color: 'inherit', transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-tertiary)', fontFeatureSettings: "'tnum'", minWidth: 24 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        {a.category?.name ?? 'News'} &middot; {formatNumber(a.views ?? 0)} views
                      </div>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ArrowUpRight size={12} />{formatNumber(a.views ?? 0)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Editor's Picks */}
          {picks.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Editor&apos;s Picks</h2>
                <Link href="/news" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>More picks &rarr;</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                {/* Hero card */}
                {hero && (
                  <Link href={`/article/${hero.slug}`} style={{
                    borderRadius: 16, overflow: 'hidden', position: 'relative', height: 400,
                    textDecoration: 'none', color: 'inherit', display: 'block',
                  }}>
                    {hero.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hero.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, oklch(45% 0.12 175), oklch(45% 0.12 220))' }} />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, oklch(10% 0.02 175 / 0.9) 0%, oklch(10% 0.02 175 / 0.2) 60%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 32, color: 'oklch(96% 0.005 175)' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 10px',
                        background: 'var(--accent)', color: 'oklch(15% 0.02 55)',
                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase', borderRadius: 4, marginBottom: 10,
                      }}>
                        {hero.category?.name ?? 'Story'}
                      </span>
                      <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.25, marginBottom: 10, textWrap: 'balance' as const }}>
                        {hero.title}
                      </h3>
                      <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        {hero.author?.name ?? '026Newsblog'}{hero.views ? ` · ${hero.views.toLocaleString()} views` : ''}
                      </span>
                    </div>
                  </Link>
                )}

                {/* Side stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {side.map((a) => (
                    <Link key={a.article_id} href={`/article/${a.slug}`} style={{
                      display: 'flex', gap: 14, padding: 14,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 12, textDecoration: 'none', color: 'inherit', flex: 1,
                      transition: 'all 0.2s',
                    }}>
                      {a.featured_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.featured_image} alt="" style={{ width: 80, height: 80, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 80, height: 80, borderRadius: 9, background: 'var(--bg-inset)', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>
                          {a.category?.name ?? 'Story'}
                        </span>
                        <h4 style={{ fontFamily: "'Newsreader', serif", fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-primary)' }}>
                          {a.title}
                        </h4>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                          {a.author?.name ?? '026Newsblog'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Authors to Follow */}
          {authors.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Authors to Follow</h2>
                <Link href="/journalists" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Browse all &rarr;</Link>
              </div>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                {authors.map((a, i) => (
                  <Link key={a.user_id} href={`/journalists/${a.user_id}`} style={{
                    minWidth: 200, padding: 20,
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: 14, textAlign: 'center', textDecoration: 'none', color: 'inherit',
                    flexShrink: 0, transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      margin: '0 auto 10px',
                      background: `linear-gradient(135deg, ${CAT_COLORS[i % CAT_COLORS.length].bg}, ${CAT_COLORS[(i + 1) % CAT_COLORS.length].bg})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'oklch(98% 0.005 175)', fontSize: '1rem', fontWeight: 700,
                    }}>
                      {a.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.profile_image} alt="" style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} />
                      ) : (
                        a.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{a.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>Author</div>
                    <span style={{
                      padding: '6px 16px', borderRadius: 7,
                      border: '1px solid var(--border)', color: 'var(--primary)',
                      fontSize: '0.75rem', fontWeight: 600, display: 'inline-block',
                    }}>View profile</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
