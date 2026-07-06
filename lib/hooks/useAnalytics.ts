'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const analyticsKeys = {
  all:        () => ['analytics'] as const,
  platform:   () => [...analyticsKeys.all(), 'platform'] as const,
  journalist: (userId: number) => [...analyticsKeys.all(), 'journalist', userId] as const,
  article:    (articleId: number) => [...analyticsKeys.all(), 'article', articleId] as const,
}

type EarningRow   = { amount: number; payout_status: string; source: string; created_at: string }
type ArticleRow   = { article_id: number; status: string; views: number }
type AnalyticsRow = { likes: number; shares: number; comments_count: number }

// ─── Platform-wide analytics (admin) ─────────────────────────────────────────
export function usePlatformAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.platform(),
    queryFn: async () => {
      const res = await fetch('/api/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Journalist stats ─────────────────────────────────────────────────────────
export function useJournalistStats(userId: number) {
  return useQuery({
    queryKey: analyticsKeys.journalist(userId),
    queryFn: async () => {
      const supabase = createClient()

      const { data: rawEarnings } = await supabase
        .from('earnings')
        .select('amount, payout_status, source, created_at')
        .eq('user_id', userId)
      const earningsData = (rawEarnings ?? []) as unknown as EarningRow[]

      const { data: rawArticles } = await supabase
        .from('articles')
        .select('article_id, status, views')
        .eq('author_id', userId)
      const articles = (rawArticles ?? []) as unknown as ArticleRow[]

      const totalViews    = articles.reduce((s, a) => s + (a.views ?? 0), 0)
      const totalEarnings = earningsData.reduce((s, e) => s + Number(e.amount), 0)
      const thisMonth     = new Date().toISOString().slice(0, 7)
      const thisMonthEarnings = earningsData
        .filter(e => e.created_at.startsWith(thisMonth))
        .reduce((s, e) => s + Number(e.amount), 0)

      const articleIds = articles.map(a => a.article_id)
      let analyticsRows: AnalyticsRow[] = []
      if (articleIds.length > 0) {
        const { data: rawAn } = await supabase
          .from('analytics')
          .select('likes, shares, comments_count')
          .in('article_id', articleIds)
        analyticsRows = (rawAn ?? []) as unknown as AnalyticsRow[]
      }

      const totalLikes    = analyticsRows.reduce((s, a) => s + (a.likes ?? 0), 0)
      const totalShares   = analyticsRows.reduce((s, a) => s + (a.shares ?? 0), 0)
      const totalComments = analyticsRows.reduce((s, a) => s + (a.comments_count ?? 0), 0)

      return {
        totalEarnings,
        thisMonthEarnings,
        totalViews,
        published:   articles.filter(a => a.status === 'published').length,
        drafts:      articles.filter(a => a.status === 'draft').length,
        underReview: articles.filter(a => a.status === 'under_review').length,
        totalLikes,
        totalShares,
        totalComments,
        avgEngagement: totalViews > 0
          ? Number(((totalLikes + totalShares) / totalViews * 100).toFixed(1))
          : 0,
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

// ─── Per-article analytics ────────────────────────────────────────────────────
export function useArticleAnalytics(articleId: number) {
  return useQuery({
    queryKey: analyticsKeys.article(articleId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('article_id', articleId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!articleId,
  })
}
