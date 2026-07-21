import { useCallback, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserProfileData {
  user_id: number
  name: string
  role: 'reader' | 'journalist' | 'admin'
  profile_image: string | null
  email?: string
  bio?: string
  created_at?: string
  articles_read: number
  saved: number
  liked: number
  comments: number
  following: number
}

export function useUserProfile(email?: string) {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!email) {
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user?.id) {
        setLoading(false)
        return
      }

      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (err) throw err

      if (data) {
        // Fetch stats
        const [saved, following, comments, articles, likes] = await Promise.all([
          supabase.from('saved_articles').select('*', { count: 'exact', head: true }).eq('user_id', data.user_id),
          supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', data.user_id),
          supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', data.user_id),
          supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', data.user_id),
          supabase.from('article_likes').select('*', { count: 'exact', head: true }).eq('user_id', data.user_id),
        ])

        setProfile({
          user_id: data.user_id,
          name: data.name || '',
          role: (data.role as UserProfileData['role']) || 'reader',
          profile_image: data.profile_image || null,
          email: user.email,
          bio: data.bio ?? undefined,
          created_at: data.created_at ?? undefined,
          articles_read: articles.count ?? 0,
          saved: saved.count ?? 0,
          liked: likes.count ?? 0,
          comments: comments.count ?? 0,
          following: following.count ?? 0,
        })
      }
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
