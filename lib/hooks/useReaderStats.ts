import { useCallback, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ReaderStats {
  reads: number
  timeMinutes: number
  comments: number
  likes: number
  saved: number
  following: number
  streak: number
  heatmap: number[]
  categories: { name: string; count: number }[]
  mostRead: { title: string; author: string; reads: number; minutes: number }[]
}

export function useReaderStats(userId?: number) {
  const [stats, setStats] = useState<ReaderStats>({
    reads: 0,
    timeMinutes: 0,
    comments: 0,
    likes: 0,
    saved: 0,
    following: 0,
    streak: 0,
    heatmap: new Array(28).fill(0),
    categories: [],
    mostRead: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Fetch stats in parallel
      const [reads, comments, likes, saved, following] = await Promise.all([
        supabase.from('article_reads').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('article_likes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('saved_articles').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      ])

      setStats(prev => ({
        ...prev,
        reads: reads.count ?? 0,
        comments: comments.count ?? 0,
        likes: likes.count ?? 0,
        saved: saved.count ?? 0,
        following: following.count ?? 0,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return { stats, loading, error, refetch: load }
}
