import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MessageCircle, Hash, ArrowRight, Sparkles, Heart } from 'lucide-react'

/**
 * "From the Community" — merges the social layer into the news landing page.
 * Server-rendered: pulls the latest short posts + trending hashtags so the
 * homepage reads as one newsroom-and-conversation product.
 */
export async function CommunityPulse() {
  let posts: Array<{
    post_id: number
    content: string
    tags: string[] | null
    like_count: number
    comment_count?: number
    created_at: string
    author: { name: string; profile_image: string | null } | null
  }> = []
  let trending: string[] = []
  let postCount = 0

  try {
    const supabase = await createClient()
    const { data } = await (supabase as any)
      .from('posts')
      .select('post_id, content, tags, like_count, comment_count, created_at, author:users(name, profile_image)')
      .order('created_at', { ascending: false })
      .limit(6)
    posts = (data ?? []) as typeof posts

    const { count } = await (supabase as any)
      .from('posts')
      .select('post_id', { count: 'exact', head: true })
    postCount = count ?? 0

    const tagCounts = new Map<string, number>()
    posts.forEach(p => (p.tags ?? []).forEach(t => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)))
    trending = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0])
  } catch {
    posts = []
  }

  const snippet = (c: string) => {
    const t = c.replace(/\s+/g, ' ').trim()
    return t.length > 180 ? `${t.slice(0, 180).trimEnd()}…` : t
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}d`
  }

  return (
    <section className="community-pulse">
      {/* Header */}
      <div className="community-pulse-head">
        <div>
          <span className="pill community-pulse-pill"><Sparkles size={13} /> The Conversation</span>
          <h2 className="community-pulse-title">From the Community</h2>
          <p className="community-pulse-sub">
            {postCount > 0 ? `${postCount.toLocaleString()} conversations happening now` : 'Join the conversation'}
          </p>
        </div>
        <Link href="/social" className="community-pulse-link">
          Open the feed <ArrowRight size={15} />
        </Link>
      </div>

      {posts.length > 0 ? (
        <>
          {/* Featured post — first post gets the spotlight */}
          <Link href={`/social?post=${posts[0].post_id}`} className="community-pulse-featured">
            <div className="community-pulse-featured-inner">
              <div className="community-pulse-card-top">
                {posts[0].author?.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={posts[0].author.profile_image} alt={posts[0].author.name} className="community-pulse-avatar lg" />
                ) : (
                  <div className="community-pulse-avatar lg">{posts[0].author?.name?.charAt(0).toUpperCase() ?? 'U'}</div>
                )}
                <div>
                  <span className="community-pulse-author">{posts[0].author?.name ?? 'Community'}</span>
                  <span className="community-pulse-time">{timeAgo(posts[0].created_at)} ago</span>
                </div>
              </div>
              <p className="community-pulse-text featured">{snippet(posts[0].content)}</p>
              <div className="community-pulse-meta">
                {posts[0].tags?.slice(0, 3).map(t => (
                  <span key={t} className="community-pulse-tag"><Hash size={12} />{t}</span>
                ))}
                <span className="community-pulse-likes"><Heart size={13} /> {posts[0].like_count ?? 0}</span>
              </div>
            </div>
          </Link>

          {/* Grid of remaining posts */}
          {posts.length > 1 && (
            <div className="community-pulse-grid">
              {posts.slice(1, 5).map(p => (
                <Link key={p.post_id} href={`/social?post=${p.post_id}`} className="community-pulse-card">
                  <div className="community-pulse-card-top">
                    {p.author?.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.author.profile_image} alt={p.author.name} className="community-pulse-avatar" />
                    ) : (
                      <div className="community-pulse-avatar">{p.author?.name?.charAt(0).toUpperCase() ?? 'U'}</div>
                    )}
                    <div>
                      <span className="community-pulse-author">{p.author?.name ?? 'Community'}</span>
                      <span className="community-pulse-time">{timeAgo(p.created_at)}</span>
                    </div>
                  </div>
                  <p className="community-pulse-text">{snippet(p.content)}</p>
                  <div className="community-pulse-meta">
                    {p.tags?.[0] && <span className="community-pulse-tag"><Hash size={12} />{p.tags[0]}</span>}
                    <span className="community-pulse-likes"><Heart size={13} /> {p.like_count ?? 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="community-pulse-empty">
          <div className="community-pulse-empty-icon">
            <MessageCircle size={32} />
          </div>
          <p>No posts yet — be the first to start the conversation.</p>
          <Link href="/social" className="community-pulse-link">Join the community <ArrowRight size={15} /></Link>
        </div>
      )}

      {/* Trending topics */}
      {trending.length > 0 && (
        <div className="community-pulse-trending">
          <span className="community-pulse-trending-label">Trending</span>
          {trending.map(t => (
            <Link key={t} href="/social" className="community-pulse-chip">#{t}</Link>
          ))}
        </div>
      )}
    </section>
  )
}
