import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NewsFeed } from '@/components/news/NewsFeed'
import { createClient } from '@/lib/supabase/server'
import type { ArticleWithAuthor } from '@/lib/supabase/types'
import type { PostgrestResponse } from '@supabase/supabase-js'

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

  const mostDiscussed = [...articles].sort((a, b) => b.views - a.views).slice(0, 5)

  return (
    <div className="news-page-shell">
      <Navbar />

      <div className="news-page-content">
        {/* Header Banner */}
        <section className="news-hero">
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <span className="news-hero-badge">Live Feed</span>
            <h1 className="news-hero-title">Latest News</h1>
            <p className="news-hero-sub">Stay informed with breaking news from Kenya and Africa</p>
          </div>
        </section>

        {/* Grid: Feed + Sidebar */}
        <section className="news-grid">
          {/* Auto-scrolling Feed */}
          <NewsFeed initialArticles={articles} />

          {/* Sidebar */}
          <aside className="news-sidebar">
            {/* Breaking News */}
            <div className="news-widget">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span className="news-breaking-dot" />
                <h3 className="news-widget-title">Breaking News</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {BREAKING.map((item, i) => (
                  <li key={i} className="news-breaking-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Most Discussed */}
            <div className="news-widget">
              <h3 className="news-widget-title" style={{ marginBottom: 16 }}>Most Discussed</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mostDiscussed.map((item, i) => (
                  <li key={item.article_id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span className="news-rank-num">{i + 1}</span>
                    <div>
                      <p className="news-discussed-title">{item.title}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.views.toLocaleString()} views
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="news-widget news-widget-newsletter">
              <h3 className="news-widget-title" style={{ marginBottom: 6, color: '#fff' }}>Stay Updated</h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
                Get the latest news delivered to your inbox every morning.
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                className="newsnewsletter-input"
              />
              <button className="newsnewsletter-btn">Subscribe</button>
            </div>
          </aside>
        </section>
      </div>

      <Footer />
    </div>
  )
}
