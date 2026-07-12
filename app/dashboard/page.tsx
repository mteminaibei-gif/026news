'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticleCard } from '@/components/news/ArticleCard'
import { formatNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Article {
  article_id: number
  title: string
  slug: string
  content: string
  excerpt?: string | null
  featured_image?: string | null
  views: number
  created_at: string
  author?: { name: string; profile_image?: string | null } | null
  category?: { name: string } | null
}

interface Author {
  user_id: number
  name: string
  bio: string | null
  profile_image: string | null
  article_count: number
  status: 'online' | 'offline'
}

export default function DashboardPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [activeTab, setActiveTab] = useState<'feed' | 'authors' | 'saved'>('feed')
  const [savedArticles, setSavedArticles] = useState<Article[]>([])
  const [savedLoading, setSavedLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
    fetchArticles()
    fetchAuthors()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) {
      window.location.href = '/login?redirect=/dashboard'
    }
  }

  async function fetchArticles() {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*, author:users(name, profile_image), category:categories(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + 11)

      if (error) throw error

      if (data.length > 0) {
        setArticles(prev => [...prev, ...data])
        setOffset(prev => prev + 12)
        setHasMore(data.length === 12)
      }
    } catch (err) {
      console.error('Error fetching articles:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAuthors() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, name, bio, profile_image, status')
        .eq('role', 'journalist')
        .eq('status', 'active')
        .limit(8)

      if (error) throw error
      setAuthors(data as Author[])
    } catch (err) {
      console.error('Error fetching authors:', err)
    }
  }

  useEffect(() => {
    if (!hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchArticles()
        }
      },
      { threshold: 0.5 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current)
      }
    }
  }, [hasMore, loading, offset])

  useEffect(() => {
    if (activeTab === 'saved' && user) loadSaved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user])

  async function loadSaved() {
    setSavedLoading(true)
    try {
      const res = await fetch('/api/saved-articles')
      const json = await res.json()
      const saved = json.data ?? []
      if (saved.length === 0) {
        setSavedArticles([])
        return
      }
      const ids = saved.map((s: any) => s.article_id)
      const { data } = await supabase
        .from('articles')
        .select('article_id, title, slug, featured_image, category:categories(name)')
        .in('article_id', ids)
      setSavedArticles((data as unknown as Article[]) ?? [])
    } catch {
      setSavedArticles([])
    } finally {
      setSavedLoading(false)
    }
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />

      <section style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'var(--text-inverse)', padding: '64px 16px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800, marginBottom: 16, fontFamily: "'Newsreader', Georgia, serif" }}>
            Welcome back, {user.email?.split('@')[0] || 'Reader'}!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem' }}>
            Your personalized news feed and connection to African journalism.
          </p>
        </div>
      </section>

      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, overflowX: 'auto' }}>
          {[
            { id: 'feed', label: 'Latest News', icon: '📰' },
            { id: 'authors', label: 'Live Authors', icon: '✨' },
            { id: 'saved', label: 'Saved Articles', icon: '📚' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                fontWeight: 600,
                transition: 'all 0.2s',
                background: activeTab === tab.id ? 'var(--primary)' : 'var(--bg-surface)',
                color: activeTab === tab.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: `1px solid ${activeTab === tab.id ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: 8 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
          <div style={{ display: activeTab === 'feed' ? 'block' : 'none' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
              Latest Articles
            </h2>

            {articles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0', background: 'var(--bg-surface)', borderRadius: 16 }}>
                <p style={{ color: 'var(--text-secondary)' }}>Loading articles...</p>
              </div>
            ) : (
              <>
                {articles.map(article => (
                  <ArticleCard key={article.article_id} article={article} variant="default" />
                ))}
                {loading && (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                    Loading more articles...
                  </div>
                )}
                <div ref={loaderRef} style={{ height: 40 }} />
              </>
            )}
          </div>

          <div style={{ display: activeTab === 'authors' ? 'block' : 'none' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                Live Authors
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {authors.map(j => (
                  <Link
                    key={j.user_id}
                    href={`/journalists/${j.user_id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, textDecoration: 'none', color: 'inherit', transition: 'background 0.2s' }}
                  >
                    {j.profile_image ? (
                      <Image src={j.profile_image} alt={j.name} width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: 18 }}>
                        {j.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{j.article_count} articles</span>
                        {j.status === 'online' && (
                          <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>● Online</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {authors.length > 0 && (
                <Link
                  href="/journalists"
                  style={{ display: 'block', width: '100%', marginTop: 16, textAlign: 'center', background: 'var(--primary)', color: 'var(--text-inverse)', fontWeight: 600, padding: '10px 0', borderRadius: 12, textDecoration: 'none', transition: 'opacity 0.2s' }}
                >
                  View All Authors
                </Link>
              )}
            </div>
          </div>

          <div style={{ display: activeTab === 'saved' ? 'block' : 'none' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Saved Articles</h2>

              {savedLoading ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' }}>Loading your catalog...</p>
              ) : savedArticles.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' }}>
                  You haven&apos;t saved any articles yet. Tap “Save” on any story to build your catalog.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {savedArticles.map(a => (
                    <Link
                      key={a.article_id}
                      href={`/article/${a.slug}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, textDecoration: 'none', color: 'inherit', background: 'var(--bg-inset)', transition: 'opacity 0.2s' }}
                    >
                      {a.featured_image ? (
                        <Image src={a.featured_image} alt={a.title} width={64} height={48} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 64, height: 48, borderRadius: 8, background: 'var(--bg-muted)', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{a.category?.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
