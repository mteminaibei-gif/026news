'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from './useAuth'

/**
 * Real, persisted "like" for an article.
 * - Reading the count/state is public.
 * - Toggling requires a signed-in user; otherwise we redirect to login.
 */
export function useLike(articleId: number, initialLikes: number, redirectTo: string, lazy = false) {
  const router = useRouter()
  const { data: user } = useUser()

  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialLikes)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (lazy) return
    let active = true
    fetch(`/api/likes?article_id=${articleId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (active && d && typeof d.count === 'number') {
          setCount(d.count)
          setLiked(!!d.liked)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [articleId, lazy])

  const toggle = useCallback(async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`)
      return
    }
    if (loading) return

    setLoading(true)
    const prevLiked = liked
    const prevCount = count

    // Optimistic update
    setLiked(v => !v)
    setCount(c => c + (prevLiked ? -1 : 1))

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setCount(data.count ?? prevCount)
      setLiked(data.liked ?? !prevLiked)
    } catch {
      // Roll back on failure
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }, [user, loading, liked, count, articleId, redirectTo, router])

  return { liked, count, toggle, loading }
}
