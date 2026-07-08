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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading rankings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#0a1628] to-[#1a3a6e] dark:from-gray-800 dark:to-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={32} className="text-orange-400" />
            <h1 className="text-4xl font-bold">Journalist Rankings</h1>
          </div>
          <p className="text-white/70">Top journalists ranked by article views and engagement</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Rankings Leaderboard */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Top Journalists</h2>
            <div className="space-y-4">
              {journalists.slice(0, 10).map((journalist, idx) => (
                <div
                  key={journalist.user_id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                      {idx + 1}
                    </div>

                    {/* Profile */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {journalist.name}
                        </h3>
                        <span className="text-2xl">{getBadgeIcon(journalist.rank_tier)}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {journalist.rank_tier.charAt(0).toUpperCase() + journalist.rank_tier.slice(1)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Eye size={16} className="text-blue-500" />
                        <span className="font-bold text-gray-900 dark:text-white">
                          {(journalist.total_views / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">views</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Articles */}
          <div>
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Trending Now</h2>
            <div className="space-y-4">
              {topArticles.slice(0, 8).map((article, idx) => (
                <Link
                  key={article.article_id}
                  href={`/article/${article.slug}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  <div className="flex gap-3">
                    <span className="font-bold text-orange-500 text-lg min-w-fit">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 text-sm mb-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm text-center">
            <Users size={32} className="mx-auto mb-3 text-blue-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Active Journalists</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {journalists.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm text-center">
            <TrendingUp size={32} className="mx-auto mb-3 text-orange-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Total Views</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {(journalists.reduce((sum, j) => sum + j.total_views, 0) / 1000000).toFixed(1)}M
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm text-center">
            <Eye size={32} className="mx-auto mb-3 text-green-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Avg Views/Journalist</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
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
