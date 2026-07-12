import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Explore — 026Newsblog' }
export const dynamic = 'force-dynamic'

const CAT_COLORS = [
  'oklch(92% 0.04 200)', 'oklch(92% 0.04 55)', 'oklch(92% 0.04 145)',
  'oklch(92% 0.04 310)', 'oklch(92% 0.04 25)', 'oklch(92% 0.04 80)',
  'oklch(92% 0.04 175)', 'oklch(92% 0.04 260)',
]
const TRENDING = ['AI Journalism', 'M-Pesa', 'Climate Summit', 'Kenyan Startups', 'Marathon Training', 'Afrofuturism']

export default async function SourcesPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: journalists }, { data: featured }] = await Promise.all([
    supabase.from('categories').select('category_id, name, slug, icon').order('name').limit(12),
    supabase.from('users').select('user_id, name, profile_image').eq('role', 'journalist').limit(8),
    supabase
      .from('articles')
      .select('article_id, title, slug, excerpt, featured_image, views, category:categories(name), author:users(name)')
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(4),
  ])

  const cats = (categories ?? []) as unknown as { category_id: number; name: string; slug: string; icon: string | null }[]
  const authors = (journalists ?? []) as unknown as { user_id: number; name: string; profile_image: string | null }[]
  const picks = (featured ?? []) as unknown as {
    article_id: number; title: string; slug: string; excerpt: string | null
    featured_image: string | null; views: number | null
    category: { name: string } | null; author: { name: string } | null
  }[]

  const hero = picks[0]
  const side = picks.slice(1, 4)

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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Trending:</span>
            {TRENDING.map((t) => (
              <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} style={{ padding: '5px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                {t}
              </Link>
            ))}
          </div>
        </section>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px' }}>
          {/* Categories */}
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Browse by Category</h2>
              <Link href="/news" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
              {cats.map((c, i) => (
                <Link key={c.category_id} href={`/category/${c.slug}`} style={{ minWidth: 180, padding: 20, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, textDecoration: 'none', color: 'inherit', scrollSnapAlign: 'start', flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: CAT_COLORS[i % CAT_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: 12 }}>{c.icon || '📰'}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                </Link>
              ))}
            </div>
          </section>

          {/* Editor's Picks */}
          {picks.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Editor&apos;s Picks</h2>
                <Link href="/news" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>More picks →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                {hero && (
                  <Link href={`/article/${hero.slug}`} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 400, textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    {hero.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hero.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, oklch(45% 0.12 175), oklch(45% 0.12 220))' }} />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, oklch(10% 0.02 175 / 0.9) 0%, oklch(10% 0.02 175 / 0.2) 60%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 32, color: 'oklch(96% 0.005 175)' }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--accent)', color: 'oklch(15% 0.02 55)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 4, marginBottom: 10 }}>{hero.category?.name ?? 'Story'}</span>
                      <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.25, marginBottom: 10 }}>{hero.title}</h3>
                      <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{hero.author?.name ?? '026Newsblog'}{hero.views ? ` · ${hero.views.toLocaleString()} views` : ''}</span>
                    </div>
                  </Link>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {side.map((a) => (
                    <Link key={a.article_id} href={`/article/${a.slug}`} style={{ display: 'flex', gap: 14, padding: 14, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, textDecoration: 'none', color: 'inherit', flex: 1 }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)' }}>{a.category?.name ?? 'Story'}</span>
                        <h4 style={{ fontFamily: "'Newsreader', serif", fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</h4>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{a.author?.name ?? '026Newsblog'}</span>
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
                <Link href="/journalists" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Browse all →</Link>
              </div>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                {authors.map((a, i) => (
                  <Link key={a.user_id} href={`/journalists/${a.user_id}`} style={{ minWidth: 200, padding: 20, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, textAlign: 'center', textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 10px', background: CAT_COLORS[i % CAT_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(98% 0.005 175)', fontSize: '1rem', fontWeight: 700 }}>
                      {a.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.profile_image} alt="" style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} />
                      ) : (
                        a.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>Author</div>
                    <span style={{ padding: '6px 16px', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>View profile</span>
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
