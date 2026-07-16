'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { APP_URL } from '@/lib/constants/app'

type UserProfile = {
  user_id: number; name: string; email: string; role: string
  bio: string | null; profile_image: string | null; status: string
}

export const authKeys = {
  user:    () => ['auth', 'user'] as const,
  profile: (email: string) => ['auth', 'profile', email] as const,
}

// ─── Current session user ─────────────────────────────────────────────────────
export function useUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return null
      return user
    },
    staleTime: Infinity,
  })
}

// ─── User profile from DB ─────────────────────────────────────────────────────
export function useProfile(email: string | undefined) {
  return useQuery({
    queryKey: authKeys.profile(email ?? ''),
    queryFn: async () => {
      if (!email) return null
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('user_id, name, email, role, bio, profile_image, status')
        .eq('email', email)
        .single()
      if (error) throw error
      return data as unknown as UserProfile | null
    },
    enabled: !!email,
  })
}

// ─── Sign in ──────────────────────────────────────────────────────────────────
export function useSignIn() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
      const supabase = createClient()
      const { data: rawProfile } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', data.user?.id ?? '')
        .single()
      const profile = rawProfile as unknown as { role: string } | null
      if (profile?.role === 'admin')      router.push('/admin/profile')
      else if (profile?.role === 'journalist') router.push('/journalist/profile')
      else router.push('/')
    },
  })
}

// ─── Sign up ──────────────────────────────────────────────────────────────────
export function useSignUp() {
  const router = useRouter()
  return useMutation({
    mutationFn: async ({
      email, password, name, bio = '', organization = '', portfolio = '', phone = '',
    }: { email: string; password: string; name: string; bio?: string; organization?: string; portfolio?: string; phone?: string }) => {
      const supabase = createClient()
      const combinedBio = `${bio}\n\nOrganization: ${organization || '-'}\nPortfolio: ${portfolio || '-'}\nPhone: ${phone || '-'}`
      // The handle_new_user trigger (DB) creates the public.users row from
      // raw_user_meta_data, so we pass profile fields via options.data.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: 'journalist', bio: combinedBio },
          emailRedirectTo: `${APP_URL}/api/auth/callback?next=/verify-email`,
        },
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`)
    },
  })
}

// ─── Sign out ─────────────────────────────────────────────────────────────────
export function useSignOut() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.clear()
      router.push('/login')
    },
  })
}

// ─── OAuth ────────────────────────────────────────────────────────────────────
export function useOAuthSignIn() {
  return useMutation({
    mutationFn: async (provider: 'google' | 'github' | 'twitter' | 'facebook') => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        },
      })
      if (error) throw error
      return data
    },
  })
}
