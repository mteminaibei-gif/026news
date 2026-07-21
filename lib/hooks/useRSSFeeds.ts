import { useCallback, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type RSSFeedRow = {
  feed_id: number
  name: string
  feed_url: string
  category_id: number | null
  is_active: boolean
  last_fetched: string | null
  fetch_count: number
  error_count: number
  last_error: string | null
  created_at: string
}

export interface RSSFeed {
  id: number
  name: string
  url: string
  category: string
  status: 'active' | 'paused' | 'error' | 'pending'
  lastSync: string
  frequency: string
  itemsPerDay?: number
  errors?: number
}

export interface FeedStats {
  total: number
  active: number
  pending: number
  errors: number
  itemsToday: number
  totalImported: number
}

export function useRSSFeeds() {
  const [feeds, setFeeds] = useState<RSSFeed[]>([])
  const [stats, setStats] = useState<FeedStats>({
    total: 0,
    active: 0,
    pending: 0,
    errors: 0,
    itemsToday: 0,
    totalImported: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const supabase = createClient()

      const { data, error: err } = await supabase
        .from('rss_feeds')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err

      const rows = (data as RSSFeedRow[] | null) ?? []
      const mapped: RSSFeed[] = rows.map((f) => ({
        id: f.feed_id,
        name: f.name,
        url: f.feed_url,
        category: f.category_id != null ? String(f.category_id) : 'Uncategorized',
        status: f.is_active ? 'active' : (f.error_count > 0 ? 'error' : 'paused'),
        lastSync: f.last_fetched ? timeAgo(f.last_fetched) : 'Never',
        frequency: 'Auto',
        itemsPerDay: f.fetch_count,
        errors: f.error_count,
      }))

      setFeeds(mapped)

      const active = mapped.filter((f) => f.status === 'active').length
      const pending = mapped.filter((f) => f.status === 'pending').length
      const errors = mapped.filter((f) => f.status === 'error').length

      setStats({
        total: mapped.length,
        active,
        pending,
        errors,
        itemsToday: mapped.reduce((s, f) => s + (f.itemsPerDay ?? 0), 0),
        totalImported: 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feeds')
    } finally {
      setLoading(false)
    }
  }, [])

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.round(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.round(hrs / 24)}d ago`
  }

  const updateFeed = useCallback(
    async (feedId: number, updates: Partial<RSSFeed>) => {
      try {
      const supabase = createClient()
      const dbUpdates: Partial<RSSFeedRow> = {}
      if (updates.url !== undefined) dbUpdates.feed_url = updates.url
      if (updates.category !== undefined) dbUpdates.category_id = Number(updates.category)
      if (updates.status !== undefined) dbUpdates.is_active = updates.status === 'active'
      const { error: err } = await supabase
        .from('rss_feeds')
        .update(dbUpdates as never)
        .eq('feed_id', feedId)

      if (err) throw err

      setFeeds(prev =>
        prev.map(f => (f.id === feedId ? { ...f, ...updates } : f))
      )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update feed')
        throw err
      }
    },
    []
  )

  useEffect(() => {
    load()
  }, [load])

  return { feeds, stats, loading, error, updateFeed, refetch: load }
}
