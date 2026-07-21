import { useCallback, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SiteSettings {
  general: {
    site_name: string
    tagline: string
    contact_email: string
    app_url: string
  }
  monetization: {
    revenue_share: number
    min_payout: number
    adsense_publisher_id: string
    stripe_publishable_key: string
    mpesa_consumer_key: string
    mpesa_consumer_secret: string
  }
  groq: {
    api_key: string
    enabled: boolean
    model: 'fast' | 'balanced' | 'premium'
    temperature: number
    max_tokens: number
  }
  admin_notifications: Record<string, boolean>
  security: Record<string, boolean>
  publishing: {
    rss_auto_publish: boolean
    rss_max_per_fetch: number
    inhouse_publish_limit: number
  }
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('site_settings')
        .select('key, value')

      if (err) throw err

      const map: Record<string, any> = {}
      data?.forEach(r => (map[r.key] = r.value))
      setSettings(map as Partial<SiteSettings>)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSetting = useCallback(
    async (key: string, value: any) => {
      try {
        const supabase = createClient()
        const { error: err } = await supabase
          .from('site_settings')
          .upsert({ key, value }, { onConflict: 'key' })

        if (err) throw err

        setSettings(prev => ({ ...prev, [key]: value }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update setting')
        throw err
      }
    },
    []
  )

  useEffect(() => {
    load()
  }, [load])

  return { settings, loading, error, updateSetting, refetch: load }
}
