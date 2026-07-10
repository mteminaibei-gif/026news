'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticleCard } from '@/components/news/ArticleCard'
import { formatNumber, formatDate } from '@/lib/utils'

// Disable static generation
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

interface Journalist {
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
  const [journalists, setJournalists] = useState<Journalist[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [activeTab, setActiveTab] = useState<'feed' | 'journalists' | 'saved'>('feed')
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
    fetchArticles()
    fetchJournalists()
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

  async function fetchJournalists() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, name, bio, profile_image, status')
        .eq('role', 'journalist')
        .eq('status', 'active')
        .limit(8)

      if (error) throw error
      setJournalists(data as Journalist[])
    } catch (err) {
      console.error('Error fetching journalists:', err)
    }
  }

  // Infinite scroll observer
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

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5c2a] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            Welcome back, {user.email?.split('@')[0] || 'Reader'}! 👋
          </h1>
          <p className="text-white/70 text-lg">
            Your personalized news feed and connection to African journalism.
            Stay informed with articles curated for your region.
          </p>
        </div>
      </section>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: 'feed', label: 'Latest News', icon: '📰' },
            { id: 'journalists', label: 'Journalists', icon: '✨' },
            { id: 'saved', label: 'Saved Articles', icon: '📚' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1a5c2a] text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feed Column */}
          <div className={`lg:col-span-2 space-y-6 ${activeTab === 'feed' ? 'block' : 'hidden'}`}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📰</span> Latest Articles
            </h2>

            {articles.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
                <p className="text-gray-500">Loading articles...</p>
              </div>
            ) : (
              <>
                {articles.map(article => (
                  <ArticleCard key={article.article_id} article={article} variant="default" />
                ))}
                {loading && (
                  <div className="text-center py-8 text-gray-500 animate-pulse">
                    Loading more articles...
                  </div>
                )}
                <div ref={loaderRef} className="h-10" />
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Journalists Widget */}
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 ${activeTab === 'journalists' ? 'block' : 'hidden'}`}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                Live Journalists
              </h2>

              <div className="space-y-4">
                {journalists.map(j => (
                  <Link
                    key={j.user_id}
                    href={`/journalists/${j.user_id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0faf2] dark:hover:bg-gray-700 transition-colors"
                  >
                    {j.profile_image ? (
                      <Image
                        src={j.profile_image}
                        alt={j.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#1a5c2a]/10 flex items-center justify-center text-[#1a5c2a] font-bold text-lg">
                        {j.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{j.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{j.article_count} articles</span>
                        {j.status === 'online' && (
                          <span className="text-xs text-green-600 font-medium">● Online</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {journalists.length > 0 && (
                <Link
                  href="/journalists"
                  className="block w-full mt-4 text-center bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  View All Journalists
                </Link>
              )}
            </div>

            {/* Saved Articles (Placeholder) */}
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 ${activeTab === 'saved' ? 'block' : 'hidden'}`}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Saved Articles</h2>
              <p className="text-gray-500 text-center py-8">Your saved articles will appear here</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}