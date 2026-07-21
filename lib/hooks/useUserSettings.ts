import { useCallback, useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface UserSettingsData {
  name: string
  bio: string
  profile_image: string | null
  email?: string
  first_name?: string
  last_name?: string
  website?: string
  email_notifications: boolean
  comment_notifications: boolean
  follow_notifications: boolean
  push_notifications: boolean
  weekly_digest: boolean
  theme: 'light' | 'dark' | 'system'
  profile_visibility: boolean
  reading_history: boolean
  two_factor: boolean
  show_online_status: boolean
}

export function useUserSettings(email?: string) {
  const [settings, setSettings] = useState<UserSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())
  const userIdRef = useRef<number | null>(null)

  const load = useCallback(async () => {
    if (!email) {
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (err) throw err

      if (profile) {
        userIdRef.current = profile.user_id as number
        const prefs = (profile.notification_prefs ?? {}) as Record<string, unknown>
        const social = (profile.social_links ?? {}) as Record<string, unknown>
        const nameParts = (profile.name || '').trim().split(/\s+/)
        const website =
          (typeof social.website === 'string' && social.website) ||
          (Array.isArray(social.links) ? (social.links as string[])[0] : '') ||
          ''
        setSettings({
          name: profile.name || '',
          bio: profile.bio || '',
          profile_image: profile.profile_image || null,
          email: user.email || '',
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          website,
          email_notifications: prefs.email_notifications !== false,
          comment_notifications: prefs.comment_notifications !== false,
          follow_notifications: prefs.follow_notifications === true,
          push_notifications: prefs.push_notifications !== false,
          weekly_digest: prefs.weekly_digest !== false,
          theme: (prefs.theme as UserSettingsData['theme']) || 'system',
          profile_visibility: prefs.profile_visibility !== false,
          reading_history: prefs.reading_history !== false,
          two_factor: prefs.two_factor === true,
          show_online_status: profile.show_online_status !== false,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [email])

  const updateSettings = useCallback(
    async (updates: Partial<UserSettingsData>) => {
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed to update settings')
        }

        setSettings(prev => prev ? { ...prev, ...updates } : null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update settings')
        throw err
      }
    },
    []
  )

  useEffect(() => {
    load()
  }, [load])

  // Subscribe to realtime changes on the users table for this user
  useEffect(() => {
    if (!userIdRef.current) return
    const uid = userIdRef.current
    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`rt:user-settings:${uid}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `user_id=eq.${uid}` },
        () => {
          load()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [load])

  return { settings, loading, error, updateSettings, refetch: load }
}
