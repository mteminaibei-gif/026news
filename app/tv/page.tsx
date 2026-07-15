import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { formatNumber, stripHtml } from '@/lib/utils'
import { Tv, Eye, Clock, ExternalLink } from 'lucide-react'

export const metadata: Metadata = { title: 'Kenyan TV — 026Newsblog' }
export const dynamic = 'force-dynamic'

const KENYAN_TV_STATIONS = [
  { name: 'Citizen TV', slug: 'citizen', color: '#16a34a', website: 'https://www.citizen.digital', logo: '🟢' },
  { name: 'NTV Kenya', slug: 'ntv', color: '#2563eb', website: 'https://ntvkenya.co.ke', logo: '🔵' },
  { name: 'KBC TV', slug: 'kbc', color: '#0f766e', website: 'https://www.kbc.co.ke', logo: '🟦' },
  { name: 'K24 TV', slug: 'k24', color: '#e11d48', website: 'https://www.k24tv.co.ke', logo: '🔴' },
  { name: 'Nation TV', slug: 'nation', color: '#ea580c', website: 'https://nation.africa', logo: '🟠' },
  { name: 'Switch TV', slug: 'switch', color: '#7c3aed', website: 'https://www.switchtv.ke', logo: '🟣' },
  { name: 'TV47', slug: 'tv47', color: '#ca8a04', website: 'https://tv47.ke', logo: '🟡' },
  { name: 'Lulu TV', slug: 'lulu', color: '#db2777', website: 'https://www.lulutv.ke', logo: '🩷' },
]

type TVArticle = {
  article_id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  views: number
  created_at: string
  source_name: string | null
  source_url: string | null
  author: { name: string; profile_image: string | null } | null
  category: { name: string } | null
}

export default async function TVPage() {
  const supabase = await createClient()

  const TV_SOURCE_PATTERNS = ['citizen', 'ntv', 'kbc', 'k24', 'nation', 'switch', 'tv47', 'lulu', 'royal media', 'standard media', 'media max']

  const { data: rawArticles } = await supabase
    .from('articles')
    .select('article_id, title, slug, excerpt, content, featured_image, views, created_at, source_name, source_url, author:users(name, profile_image), category:categories(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(200)

  const allArticles = (rawArticles ?? []) as unknown as TVArticle[]

  const articles = allArticles.filter(a => {
    const src = (a.source_name ?? '').toLowerCase()
    return TV_SOURCE_PATTERNS.some(p => src.includes(p))
  })

  const stationArticles: Record<string, TVArticle[]> = {}
  for (const station of KENYAN_TV_STATIONS) {
    stationArticles[station.slug] = articles.filter(a => {
      const src = (a.source_name ?? '').toLowerCase()
      return src.includes(station.slug) || src.includes(station.name.toLowerCase())
    }).slice(0, 6)
  }

  const latestArticles = articles.slice(0, 12)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '48px 0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingInline: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tv size={24} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
                Kenyan TV
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                Latest stories from Kenya&apos;s top TV stations
              </p>
            </div>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px', width: '100%' }}>
        {/* Station Cards */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            TV Stations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {KENYAN_TV_STATIONS.map(station => {
              const count = (stationArticles[station.slug] ?? []).length
              return (
                <a
                  key={station.slug}
                  href={station.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 16,
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: 14, textDecoration: 'none', color: 'inherit',
                    transition: 'all 0.2s', cursor: 'pointer',
                  }}
                  className="hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${station.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                    {station.logo}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{station.name}</h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      {count} {count === 1 ? 'article' : 'articles'}
                    </p>
                  </div>
                  <ExternalLink size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                </a>
              )
            })}
          </div>
        </section>

        {/* Latest from all stations */}
        {latestArticles.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Latest Stories
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {latestArticles.map(article => {
                const station = KENYAN_TV_STATIONS.find(s => {
                  const src = (article.source_name ?? '').toLowerCase()
                  return src.includes(s.slug) || src.includes(s.name.toLowerCase())
                })
                return (
                  <Link
                    key={article.article_id}
                    href={`/article/${article.slug}`}
                    style={{
                      display: 'flex', gap: 14, padding: 16,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 14, textDecoration: 'none', color: 'inherit',
                      transition: 'all 0.2s',
                    }}
                    className="hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {article.featured_image ? (
                      <div style={{ position: 'relative', width: 100, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                        <Image src={article.featured_image} alt="" fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div style={{ width: 100, height: 80, borderRadius: 10, background: station ? `${station.color}15` : 'var(--bg-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tv size={20} style={{ color: station?.color ?? 'var(--text-tertiary)' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                      <div>
                        {station && (
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: station.color }}>
                            {station.name}
                          </span>
                        )}
                        <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.3, marginTop: station ? 3 : 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-primary)' }}>
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {stripHtml(article.excerpt)}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} /> {formatNumber(article.views ?? 0)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {new Date(article.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Per-station sections */}
        {KENYAN_TV_STATIONS.map(station => {
          const stationArts = stationArticles[station.slug] ?? []
          if (stationArts.length === 0) return null
          return (
            <section key={station.slug} style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.3rem' }}>{station.logo}</span>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{station.name}</h2>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{stationArts.length} articles</span>
                </div>
                <a href={station.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', fontWeight: 600, color: station.color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Visit site <ExternalLink size={12} />
                </a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {stationArts.map(article => (
                  <Link
                    key={article.article_id}
                    href={`/article/${article.slug}`}
                    style={{
                      display: 'flex', gap: 12, padding: 14,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 12, textDecoration: 'none', color: 'inherit',
                      transition: 'all 0.2s',
                    }}
                    className="hover:shadow-md"
                  >
                    {article.featured_image ? (
                      <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        <Image src={article.featured_image} alt="" fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: 8, background: `${station.color}12`, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-primary)' }}>
                        {article.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10} /> {formatNumber(article.views ?? 0)}</span>
                        <span>{new Date(article.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        {articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: 64, background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
            <Tv size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No TV articles yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              Articles from Kenyan TV stations will appear here once RSS feeds are synced.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
