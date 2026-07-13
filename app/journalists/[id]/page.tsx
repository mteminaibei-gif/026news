import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticleCard } from '@/components/news/ArticleCard'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

interface Props { params: Promise<{ id: string }> }

type JournalistProfile = {
  user_id: number
  name: string
  bio: string | null
  profile_image: string | null
  email: string
  created_at: string
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('name, bio, profile_image, created_at')
    .eq('user_id', Number(id))
    .eq('role', 'journalist' as never)
    .single()

  if (!data) return { title: 'Author Not Found' }
  const j = data as { name: string; bio: string | null; profile_image: string | null; created_at: string }
  return {
    title: `${j.name} · 026Newsblog`,
    description: j.bio ?? `Read articles by ${j.name} on 026Newsblog.`,
    openGraph: {
      title: `${j.name} | 026Newsblog`,
      description: j.bio ?? '',
      images: j.profile_image ? [{ url: j.profile_image }] : [],
    },
  }
}

export default async function JournalistProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rawJournalist } = await supabase
    .from('users')
    .select('user_id, name, bio, profile_image, email, created_at')
    .eq('user_id', Number(id))
    .eq('role', 'journalist' as never)
    .single()

  if (!rawJournalist) notFound()
  const journalist = rawJournalist as unknown as JournalistProfile

  const { data: rawArticles } = await supabase
    .from('articles')
    .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
    .eq('author_id', journalist.user_id)
    .eq('status', 'published' as never)
    .order('created_at', { ascending: false })
    .limit(20)
  const articles = (rawArticles ?? []) as unknown as ArticleWithAuthor[]

  const totalViews = articles.reduce((s, a) => s + (a.views ?? 0), 0)
  const totalLikes = articles.reduce((s, a) => s + (a.likes ?? 0), 0)

  const joinDate = new Date(journalist.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const categories = [...new Set(articles.map(a => a.category?.name).filter(Boolean))]

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <Navbar />

      {/* Profile Header */}
      <header style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 40px', display: 'flex', gap: 32, alignItems: 'flexStart' }}>
        <div style={{ width: 120, height: 120, borderRadius: 28, background: 'linear-gradient(135deg, oklch(50% 0.14 220), oklch(42% 0.12 200))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 700, color: 'oklch(98% 0.005 175)', flexShrink: 0 }}>
          {journalist.profile_image ? (
            <Image src={journalist.profile_image} alt={journalist.name} fill style={{ objectFit: 'cover', borderRadius: 28 }} />
          ) : (
            journalist.name.charAt(0)
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, fontFamily: "'Newsreader', Georgia, serif" }}>{journalist.name}</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', marginBottom: 10 }}>@{journalist.name.toLowerCase().replace(/\s+/g, '')} · Joined {joinDate}</p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '55ch', lineHeight: 1.6, marginBottom: 16 }}>{journalist.bio ?? 'No bio available.'}</p>
          <div style={{ display: 'flex', gap: 28, marginBottom: 16 }}>
            <div><div style={{ fontSize: '1.3rem', fontWeight: 700, fontFeatureSettings: 'tnum' }}>{articles.length}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Articles</div></div>
            <div><div style={{ fontSize: '1.3rem', fontWeight: 700, fontFeatureSettings: 'tnum' }}>{formatNumber(totalViews)}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Views</div></div>
            <div><div style={{ fontSize: '1.3rem', fontWeight: 700, fontFeatureSettings: 'tnum' }}>{formatNumber(totalLikes)}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Likes</div></div>
            <div><div style={{ fontSize: '1.3rem', fontWeight: 700, fontFeatureSettings: 'tnum' }}>{categories.length}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Categories</div></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ padding: '10px 20px', borderRadius: 9, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', background: 'var(--primary)', color: 'oklch(98% 0.005 175)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> Follow
            </button>
            <button style={{ padding: '10px 20px', borderRadius: 9, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Message
            </button>
            <button style={{ padding: '10px 20px', borderRadius: 9, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 0 }}>
        <button style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)', borderBottom: '2px solid var(--primary)', cursor: 'pointer', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontFamily: 'inherit' }}>Articles (12)</button>
        <button style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-tertiary)', cursor: 'pointer', borderBottom: '2px solid transparent', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontFamily: 'inherit' }}>About</button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40 }}>
        <main>
          {articles.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {articles.map(article => (
                <Link key={article.article_id} href={`/article/${article.slug}`} style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 20, padding: 20, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, transition: 'all 0.25s', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'spaceBetween' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', marginBottom: 6 }}>{article.category?.name}</span>
                      <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.35, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.content.slice(0, 160).replace(/\n/g, ' ')}...</p>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 12 }}>
                      <span>{article.views?.toLocaleString()} views</span>
                      <span>{article.likes?.toLocaleString()} likes</span>
                    </div>
                  </div>
                  {article.featured_image ? (
                    <Image className="article-card-img" src={article.featured_image} alt={article.title} width={180} height={160} style={{ width: '100%', height: '100%', minHeight: 130, borderRadius: 10, objectFit: 'cover' }} />
                  ) : (
                    <div className="article-card-img" style={{ width: '100%', height: '100%', minHeight: 130, borderRadius: 10, background: 'var(--bg-inset)' }} />
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>📭</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No published articles yet.</p>
            </div>
          )}
        </main>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Pinned Article */}
          {articles.length > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 14 }}>Pinned Article</h3>
              <div style={{ padding: 16, background: 'var(--primary-light)', borderRadius: 10, cursor: 'pointer' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', marginBottom: 6 }}>★ Author's Pick</div>
                <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.35 }}>{articles[0].title}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 6 }}>{formatNumber(articles[0].views)} views · {formatNumber(articles[0].likes)} likes</div>
              </div>
            </div>
          )}

          {/* Topics */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 14 }}>Topics</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {categories.slice(0, 6).map(cat => (
                <span key={cat} style={{ padding: '5px 12px', background: 'var(--bg-inset)', borderRadius: 14, fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{cat}</span>
              ))}
            </div>
          </div>

          {/* Monthly Stats */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 14 }}>This Month</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
              <div style={{ padding: 12, background: 'var(--bg-inset)', borderRadius: 9, textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 700, fontFeatureSettings: 'tnum' }}>{formatNumber(articles.filter(a => new Date(a.created_at).getMonth() === new Date().getMonth()).reduce((s, a) => s + (a.views ?? 0), 0))}</div><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Views</div></div>
              <div style={{ padding: 12, background: 'var(--bg-inset)', borderRadius: 9, textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 700, fontFeatureSettings: 'tnum' }}>{formatNumber(articles.filter(a => new Date(a.created_at).getMonth() === new Date().getMonth()).reduce((s, a) => s + (a.likes ?? 0), 0))}</div><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Likes</div></div>
              <div style={{ padding: 12, background: 'var(--bg-inset)', borderRadius: 9, textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 700, fontFeatureSettings: 'tnum' }}>{articles.filter(a => new Date(a.created_at).getMonth() === new Date().getMonth()).length}</div><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Articles</div></div>
              <div style={{ padding: 12, background: 'var(--bg-inset)', borderRadius: 9, textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 700, fontFeatureSettings: 'tnum' }}>+{articles.filter(a => new Date(a.created_at).getMonth() === new Date().getMonth()).length * 60}</div><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Followers</div></div>
            </div>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  )
}