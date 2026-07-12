'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, TrendingUp, Eye, Users } from 'lucide-react'

interface JournalistStats {
  user_id: number
  name: string
  profile_image: string | null
  total_views: number
  total_earnings: number
  rank_position: number
  rank_tier: string
  article_count: number
}

interface TopArticle {
  article_id: number
  title: string
  slug: string
  views: number
  author_name: string
  category: string
}

export default function RankingsPage() {
  const [journalists, setJournalists] = useState<JournalistStats[]>([])
  const [topArticles, setTopArticles] = useState<TopArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const [journalistsRes, articlesRes] = await Promise.all([
          fetch('/api/rankings/journalists'),
          fetch('/api/articles?sort=trending&limit=10'),
        ])

        if (journalistsRes.ok) {
          const journalistsData = await journalistsRes.json()
          setJournalists(journalistsData.journalists || [])
        }

        if (articlesRes.ok) {
          const articlesData = await articlesRes.json()
          setTopArticles(articlesData.articles || [])
        }
      } catch (error) {
        console.error('Failed to fetch rankings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [])

  const getBadgeIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return '👑'
      case 'gold':
        return '🥇'
      case 'silver':
        return '🥈'
      case 'bronze':
        return '🥉'
      default:
        return '⭐'
    }
  }

  const getBadgeColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-purple-500 to-pink-500'
      case 'gold':
        return 'from-yellow-400 to-orange-500'
      case 'silver':
        return 'from-gray-300 to-gray-400'
      case 'bronze':
        return 'from-amber-600 to-orange-600'
      default:
        return 'from-blue-400 to-blue-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading rankings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <section
        className="text-white py-12"
        style={{ background: 'linear-gradient(to right, var(--bg-elevated), var(--primary))' }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={32} style={{ color: 'var(--accent)' }} />
            <h1 className="text-4xl font-bold" style={{ fontFamily: "'Newsreader', Georgia, serif" }}>Author Rankings</h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Top authors ranked by article views and engagement</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Rankings Leaderboard */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)', fontFamily: "'Newsreader', Georgia, serif" }}>Top Authors</h2>
            <div className="space-y-4">
              {journalists.slice(0, 10).map((journalist, idx) => (
                <div
                  key={journalist.user_id}
                  className="rounded-lg p-4 transition-shadow"
                  style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: 'linear-gradient(to bottom right, var(--accent), var(--primary))' }}
                    >
                      {idx + 1}
                    </div>

                    {/* Profile */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {journalist.name}
                        </h3>
                        <span className="text-2xl">{getBadgeIcon(journalist.rank_tier)}</span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {journalist.rank_tier.charAt(0).toUpperCase() + journalist.rank_tier.slice(1)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Eye size={16} style={{ color: 'var(--primary)' }} />
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {(journalist.total_views / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>views</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Articles */}
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)', fontFamily: "'Newsreader', Georgia, serif" }}>Trending Now</h2>
            <div className="space-y-4">
              {topArticles.slice(0, 8).map((article, idx) => (
                <Link
                  key={article.article_id}
                  href={`/article/${article.slug}`}
                  className="block rounded-lg p-4 transition-all"
                  style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex gap-3">
                    <span className="font-bold text-lg min-w-fit" style={{ color: 'var(--accent)' }}>#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2 text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <span>{article.author_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {(article.views / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid sm:grid-cols-3 gap-6 mt-12">
          <div className="rounded-lg p-6 text-center" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--primary)' }} />
            <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>Active Authors</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {journalists.length}
            </p>
          </div>

          <div className="rounded-lg p-6 text-center" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <TrendingUp size={32} className="mx-auto mb-3" style={{ color: 'var(--accent)' }} />
            <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>Total Views</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {(journalists.reduce((sum, j) => sum + j.total_views, 0) / 1000000).toFixed(1)}M
            </p>
          </div>

          <div className="rounded-lg p-6 text-center" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <Eye size={32} className="mx-auto mb-3" style={{ color: 'var(--success)' }} />
            <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>Avg Views/Author</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {journalists.length > 0
                ? (journalists.reduce((sum, j) => sum + j.total_views, 0) / journalists.length / 1000).toFixed(0)
                : 0}
              K
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
