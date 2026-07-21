'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface SiteSettingsMap {
  [key: string]: any
}

const SETTINGS_QUERY_KEY = ['site-settings']
const USER_SETTINGS_KEY = ['user-settings']

export function useRealtimeSettings() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<SiteSettingsMap>({})
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabaseRef.current
        .from('site_settings')
        .select('key, value')

      if (error) throw error

      const map: SiteSettingsMap = {}
      data?.forEach((r: { key: string; value: any }) => {
        map[r.key] = r.value
      })
      setSettings(map)
      queryClient.setQueryData(SETTINGS_QUERY_KEY, map)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [queryClient])

  useEffect(() => {
    loadSettings()
    const supabase = supabaseRef.current

    const channel = supabase
      .channel('rt:site-settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        () => {
          loadSettings()
          queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
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
  }, [loadSettings, queryClient])

  const getSetting = useCallback(
    (key: string) => settings[key],
    [settings]
  )

  const getSection = useCallback(
    (section: string) => settings[section] ?? {},
    [settings]
  )

  return { settings, loading, getSetting, getSection, refetch: loadSettings }
}

export function useRealtimeUserSettings(userId?: number) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    if (!userId) return
    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`rt:user-settings:${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: USER_SETTINGS_KEY })
          queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
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
  }, [userId, queryClient])
}
