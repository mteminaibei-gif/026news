'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useUser } from '@/lib/hooks/useAuth'

/**
 * Sends a heartbeat to /api/presence every 30s while the tab is active.
 * Automatically stops when the component unmounts or the user signs out.
 */
export function usePresence() {
  const { data: user } = useUser()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const heartbeat = useCallback(async () => {
    try {
      await fetch('/api/presence', { method: 'POST' })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!user) return

    heartbeat()
    intervalRef.current = setInterval(heartbeat, 30000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user, heartbeat])
}

/**
 * Check which user IDs are currently online.
 * Returns a Set of online user IDs.
 */
export async function fetchOnlineUsers(userIds: number[]): Promise<Set<number>> {
  if (!userIds.length) return new Set()
  try {
    const res = await fetch(`/api/presence?user_ids=${userIds.join(',')}`)
    const data = await res.json()
    return new Set(data.online ?? [])
  } catch {
    return new Set()
  }
}
