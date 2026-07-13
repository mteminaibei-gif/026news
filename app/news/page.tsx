import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NewsFeed } from '@/components/news/NewsFeed'
import { createClient } from '@/lib/supabase/server'
import type { ArticleWithAuthor } from '@/lib/supabase/types'
import type { PostgrestResponse } from '@supabase/supabase-js'

const CATEGORY_FILTERS = ['All', 'Kenya', 'Politics', 'Business', 'Tech', 'Sports', 'Health', 'Africa']

const BREAKING = [
  'Parliament passes new digital economy bill after heated debate',
  'Nairobi Stock Exchange hits all-time high amid foreign investment surge',
  'Kenya signs trade deal with European Union worth KSh 50 billion',
  'President announces new affordable housing initiative for youth',
]

export default async function NewsPage() {
  const supabase = await createClient()

  const articles: ArticleWithAuthor[] = await (async () => {
    try {
      const response = await supabase
        .from('articles')
        .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
        .eq('status', 'published' as never)
        .order('created_at', { ascending: false })
        .limit(100) as PostgrestResponse<ArticleWithAuthor>
      if (response.error) throw response.error
      return response.data ?? []
    } catch {
      return []
    }
  })()

  const trending = [...articles].sort((a, b) => b.views - a.views).slice(0, 5)
  const mostDiscussed = [...articles].sort((a, b) => b.views - a.views).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Header */}
        <section
          style={{
            background: 'linear-gradient(135deg, var(--bg-elevated), var(--primary))',
            padding: '48px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '6px 16px',
                borderRadius: 999,
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                marginBottom: 16,
              }}
            >
              Live Feed
            </span>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#fff',
                fontFamily: "'Newsreader', Georgia, serif",
                marginBottom: 12,
              }}
            >
              Latest News
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
              Stay informed with breaking news from Kenya and Africa
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
          {/* Feed */}
          <NewsFeed initialArticles={articles} />

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Breaking News */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
                padding: 20,
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--error)',
                    animation: 'pulseGlow 2s ease-in-out infinite',
                  }}
                />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Breaking News
                </h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {BREAKING.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      paddingBottom: 12,
                      borderBottom: i < BREAKING.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Most Discussed */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
                padding: 20,
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                Most Discussed
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mostDiscussed.map((item, i) => (
                  <li key={item.article_id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.35,
                          marginBottom: 4,
                          cursor: 'pointer',
                        }}
                      >
                        {item.title}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.views.toLocaleString()} views
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter Signup */}
            <div
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                borderRadius: 16,
                padding: 24,
                color: '#fff',
              }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  fontFamily: "'Newsreader', Georgia, serif",
                  marginBottom: 6,
                }}
              >
                Stay Updated
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
                Get the latest news delivered to your inbox every morning.
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  marginBottom: 10,
                }}
              />
              <button
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Subscribe
              </button>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  )
}
