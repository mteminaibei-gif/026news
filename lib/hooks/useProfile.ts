import { useCallback, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  user_id: number
  auth_id: string
  name: string
  role: 'reader' | 'journalist' | 'admin'
  email?: string
  bio?: string
  profile_image?: string
  created_at?: string
  total_views?: number
}

export function useProfile(email?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!email) {
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (err) throw err
      setProfile(data as UserProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    load()
  }, [load])

  return { profile, loading, error, refetch: load }
}
