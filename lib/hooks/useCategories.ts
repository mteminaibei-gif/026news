'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Category {
  category_id: number
  name: string
  slug: string
  description?: string | null
  icon?: string | null
}

/**
 * Public category list with real-time updates.
 * Fetches once, then subscribes to INSERT/UPDATE/DELETE on the
 * `categories` table so new/edited categories appear instantly
 * (the table is already in the supabase_realtime publication).
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      const data = (await res.json()) as Category[] | { error?: string }
      if (!res.ok || !Array.isArray(data)) {
        const err = !Array.isArray(data) ? (data as { error?: string }).error : undefined
        setError(err || 'Failed to load categories')
      } else {
        setCategories(data as Category[])
        setError(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('public-categories')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => load()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  return { categories, loading, error, reload: load }
}
