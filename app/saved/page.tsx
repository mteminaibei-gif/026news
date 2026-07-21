'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useAuth'
import { usePosts } from '@/lib/hooks/usePosts'
import { PostCard } from '@/components/social/PostCard'
import { Bookmark, ArrowLeft, Newspaper, Users, BookmarkCheck } from 'lucide-react'

type SavedArticle = {
  saved_id: number
  article_id: number
  saved_at: string
  articles: {
    article_id: number
    title: string
    slug: string
    excerpt: string | null
    featured_image: string | null
    views: number
    created_at: string
    author: { name: string; profile_image: string | null } | null
    category: { name: string } | null
  } | null
}

export default function SavedPage() {
  const router = useRouter()
  const { data: authUser } = useUser()
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'posts' | 'articles'>('posts')

  const { posts, loading: postsLoading, toggleLike } = usePosts('saved')

  useEffect(() => {
    if (!authUser) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('users').select('user_id').eq('auth_id', user.id).single()
        if (!profile) return

        const { data } = await supabase
          .from('saved_articles')
          .select('saved_id, article_id, saved_at, articles!inner(article_id, title, slug, excerpt, featured_image, views, created_at, author:users(name, profile_image), category:categories(name))')
          .eq('user_id', (profile as { user_id: number }).user_id)
          .order('saved_at', { ascending: false })

        setSavedArticles((data as SavedArticle[]) ?? [])
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [authUser])

  if (!authUser) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <BookmarkCheck size={40} style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-tertiary)' }}>Sign in to see your saved content</p>
        <Link href="/login" style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: '#fff', fontWeight: 600, textDecoration: 'none' }}>
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Saved</h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Your bookmarked posts and articles</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: 'posts' as const, label: 'Posts', Icon: Users, count: posts.length },
          { key: 'articles' as const, label: 'Articles', Icon: Newspaper, count: savedArticles.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === t.key ? 'var(--primary)' : 'var(--glass-bg)',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${tab === t.key ? 'var(--primary)' : 'var(--glass-border)'}`,
              cursor: 'pointer',
            }}
          >
            <t.Icon size={14} />
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        postsLoading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>Loading saved posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <Bookmark size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No saved posts yet</p>
            <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-tertiary)' }}>Bookmark posts on Social to see them here</p>
            <Link href="/social" className="inline-block px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff', textDecoration: 'none' }}>
              Browse Social
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {posts.map(p => <PostCard key={p.post_id} post={p} onToggleLike={toggleLike} />)}
          </div>
        )
      )}

      {tab === 'articles' && (
        loading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>Loading saved articles...</div>
        ) : savedArticles.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <Bookmark size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No saved articles yet</p>
            <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-tertiary)' }}>Save articles while reading to see them here</p>
            <Link href="/news" className="inline-block px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff', textDecoration: 'none' }}>
              Browse News
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {savedArticles.map(sa => {
              const article = sa.articles
              if (!article) return null
              return (
                <Link
                  key={sa.saved_id}
                  href={`/article/${article.slug}`}
                  className="flex gap-4 p-4 rounded-xl transition-all"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  {article.featured_image && (
                    <img
                      src={article.featured_image}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-xs line-clamp-2 mb-1" style={{ color: 'var(--text-tertiary)' }}>{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span>{article.author?.name ?? 'Unknown'}</span>
                      {article.category?.name && <span>{article.category.name}</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
