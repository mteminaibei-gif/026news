import { useCallback, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AdminSettingsData {
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
  publishing: {
    rss_auto_publish: boolean
    rss_max_per_fetch: number
    inhouse_publish_limit: number
  }
  admin_notifications: Record<string, boolean>
  security: Record<string, boolean>
}

const DEFAULTS: AdminSettingsData = {
  general: {
    site_name: '026Newsblog',
    tagline: "Kenya's Premier Digital News Platform",
    contact_email: 'hello@026newsblog.com',
    app_url: 'https://026newsblog.vercel.app',
  },
  monetization: {
    revenue_share: 70,
    min_payout: 50,
    adsense_publisher_id: '',
    stripe_publishable_key: '',
    mpesa_consumer_key: '',
    mpesa_consumer_secret: '',
  },
  publishing: {
    rss_auto_publish: true,
    rss_max_per_fetch: 20,
    inhouse_publish_limit: 10,
  },
  admin_notifications: {
    new_submission: true,
    article_decision: true,
    new_user: true,
    flagged_comment: true,
    payout_request: true,
  },
  security: {
    two_factor: false,
    email_verification: true,
    rate_limiting: true,
    block_vpn: false,
  },
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettingsData>(DEFAULTS)
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

      setSettings({
        general: { ...DEFAULTS.general, ...map.general },
        monetization: { ...DEFAULTS.monetization, ...map.monetization },
        publishing: { ...DEFAULTS.publishing, ...map.publishing },
        admin_notifications: { ...DEFAULTS.admin_notifications, ...map.admin_notifications },
        security: { ...DEFAULTS.security, ...map.security },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSetting = useCallback(
    async (section: keyof AdminSettingsData, value: any) => {
      try {
        const supabase = createClient()
        const { error: err } = await supabase
          .from('site_settings')
          .upsert({ key: section, value }, { onConflict: 'key' })

        if (err) throw err

        setSettings(prev => ({ ...prev, [section]: value }))
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
