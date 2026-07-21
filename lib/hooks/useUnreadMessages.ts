'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser, useProfile } from '@/lib/hooks/useAuth'

/**
 * Live unread message count for the current user.
 * Counts rows in `messages` where receiver_id = me AND is_read = false,
 * and re-fetches on any INSERT/UPDATE affecting my inbox (realtime).
 */
export function useUnreadMessages() {
  const { data: user } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  const myId = profile?.user_id ?? 0

  const fetchUnread = useCallback(async () => {
    if (!myId) { setUnread(0); setLoading(false); return }
    const supabase = createClient()
    const { count, error } = await supabase
      .from('messages')
      .select('message_id', { count: 'exact', head: true })
      .eq('receiver_id', myId)
      .eq('is_read', false) as { count: number | null; error: any }
    if (!error) setUnread(count ?? 0)
    setLoading(false)
  }, [myId])

  useEffect(() => {
    fetchUnread()
  }, [fetchUnread])

  useEffect(() => {
    if (!myId) return
    const supabase = createClient()
    const channelName = `unread-messages-${myId}-${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${myId}` },
        () => fetchUnread()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myId, fetchUnread])

  return { unread, loading }
}
