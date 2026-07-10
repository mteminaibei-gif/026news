'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface RealtimeMetrics {
  activeUsers: number
  articlesPublished: number
  totalViews: number
  totalEarnings: number
  averageEngagement: number
  topArticles: Array<{ title: string; views: number; earnings: number }>
  recentActivity: Array<{ id: string; type: string; timestamp: string; user: string }>
}

const INITIAL_METRICS: RealtimeMetrics = {
  activeUsers: 0,
  articlesPublished: 0,
  totalViews: 0,
  totalEarnings: 0,
  averageEngagement: 0,
  topArticles: [],
  recentActivity: [],
}

export function useRealtimeAnalytics() {
  const [metrics, setMetrics] = useState<RealtimeMetrics>(INITIAL_METRICS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null)

      // Get active users (logged in last 30 minutes)
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('last_login', new Date(Date.now() - 30 * 60000).toISOString())

      // Get articles published today
      const { count: articlesPublished } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', new Date().toISOString().split('T')[0])

      // Get total views (from analytics table or articles view count)
      const { data: viewsData } = await supabase
        .from('articles')
        .select('view_count') as any

      const totalViews = viewsData?.reduce((sum: number, a: any) => sum + (a.view_count || 0), 0) || 0

      // Get total earnings
      const { data: earningsData } = await supabase
        .from('articles')
        .select('earnings') as any

      const totalEarnings = earningsData?.reduce((sum: number, a: any) => sum + (a.earnings || 0), 0) || 0

      // Get top articles
      const { data: topArticles } = await supabase
        .from('articles')
        .select('title, view_count, earnings')
        .order('view_count', { ascending: false })
        .limit(5) as any

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('articles')
        .select('article_id, title, published_at, users:author_id(name)')
        .order('published_at', { ascending: false })
        .limit(10) as any

      setMetrics({
        activeUsers: activeUsers || 0,
        articlesPublished: articlesPublished || 0,
        totalViews,
        totalEarnings,
        averageEngagement: totalViews > 0 ? Math.round((totalViews / (articlesPublished || 1)) * 100) / 100 : 0,
        topArticles: (topArticles || []).map((a: any) => ({
          title: a.title,
          views: a.view_count || 0,
          earnings: a.earnings || 0,
        })),
        recentActivity: (recentActivity || []).map((a: any) => ({
          id: a.article_id,
          type: 'article_published',
          timestamp: a.published_at,
          user: (a.users as any)?.name || 'Unknown',
        })),
      })

      setLoading(false)
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchMetrics()

    // Fetch metrics every 5 seconds for real-time updates
    const interval = setInterval(fetchMetrics, 5000)

    // Subscribe to real-time changes
    const articleSubscription = supabase
      .channel('articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articles' },
        () => {
          fetchMetrics()
        }
      )
      .subscribe()

    const userSubscription = supabase
      .channel('users')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        () => {
          fetchMetrics()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(articleSubscription)
      supabase.removeChannel(userSubscription)
    }
  }, [fetchMetrics, supabase])

  return { metrics, loading, error, refetch: fetchMetrics }
}
