'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AnalyticsData {
  totalArticles: number
  totalUsers: number
  totalJournalists: number
  totalViews: number
  totalRevenue: number
  monthRevenue: number
}

interface Metrics {
  totalArticles: number
  totalUsers: number
  totalJournalists: number
  totalViews: number
  totalRevenue: number
  totalEarnings: number
  monthRevenue: number
  activeUsers: number
  articlesPublished: number
  recentActivity: { user: string; timestamp: string }[]
}

export function useRealtimeAnalytics(initial?: AnalyticsData) {
  const [data, setData] = useState<AnalyticsData>(initial ?? {
    totalArticles: 0, totalUsers: 0, totalJournalists: 0, totalViews: 0, totalRevenue: 0, monthRevenue: 0,
  })
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const refresh = useCallback(async () => {
    const supabase = createClient()
    try {
      const [articlesRes, usersRes, journalistsRes, viewsRes, earningsRes] = await Promise.all([
        supabase.from('articles').select('article_id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('users').select('user_id', { count: 'exact', head: true }),
        supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist'),
        supabase.from('articles').select('views').eq('status', 'published'),
        supabase.from('earnings').select('amount, created_at'),
      ])

      const totalViews = (viewsRes.data ?? []).reduce((s: number, a: { views: number | null }) => s + (a.views ?? 0), 0)
      const earnings = (earningsRes.data ?? []) as { amount: number; created_at: string }[]
      const totalRevenue = earnings.reduce((s, e) => s + Number(e.amount), 0)
      const thisMonth = new Date().toISOString().slice(0, 7)
      const monthRevenue = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)

      setData({
        totalArticles: articlesRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
        totalJournalists: journalistsRes.count ?? 0,
        totalViews,
        totalRevenue,
        monthRevenue,
      })
      setLastUpdate(new Date())
    } catch {}
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('admin-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'earnings' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => refresh())
      .subscribe()

    const interval = setInterval(refresh, 30000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [refresh])

  // Build metrics object for AdminControlPanel compatibility
  const metrics: Metrics = {
    ...data,
    totalEarnings: data.totalRevenue,
    activeUsers: data.totalUsers,
    articlesPublished: data.totalArticles,
    recentActivity: [],
  }

  return { ...data, metrics, lastUpdate, refresh }
}
