import { useCallback, useEffect, useState } from 'react'

export function useFollow(targetUserId: number, initialFollowing?: boolean) {
  const [following, setFollowing] = useState(!!initialFollowing)
  const [loading, setLoading] = useState(false)
  const checked = initialFollowing !== undefined

  const checkStatus = useCallback(async () => {
    if (!targetUserId || checked) return
    try {
      const res = await fetch(`/api/follow?targetUserId=${targetUserId}`)
      if (!res.ok) return
      const data = await res.json()
      setFollowing(!!data.following)
    } catch {
      /* ignore */
    }
  }, [targetUserId, checked])

  const toggle = useCallback(async () => {
    if (loading) return
    setLoading(true)
    const next = !following
    setFollowing(next) // optimistic
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action: next ? 'follow' : 'unfollow' }),
      })
      if (!res.ok) setFollowing(!next) // revert
    } catch {
      setFollowing(!next) // revert
    } finally {
      setLoading(false)
    }
  }, [following, loading, targetUserId])

  return { following, loading, toggle, checkStatus }
}

export interface FollowSuggestion {
  user_id: number
  name: string
  profile_image: string | null
  role: string
  bio: string | null
}

export function useFollowSuggestions() {
  const [suggestions, setSuggestions] = useState<FollowSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/follow?mode=suggestions')
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions ?? [])
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { suggestions, loading, reload: load }
}
