import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'View and manage your 026connet! profile, posts, saved articles, and settings.',
}

type UserProfile = { user_id: number; name: string; profile_image: string | null; role: string }

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?error=login_required&redirect=/social')

  const { data: rawProfile } = await supabase
    .from('users')
    .select('user_id, name, profile_image, role')
    .eq('auth_id', user.id)
    .single()

  const profile = rawProfile as unknown as UserProfile | null

  if (!profile) redirect('/login')

  if (profile.role === 'admin') redirect('/admin')

  // Global app rail + navbar (LayoutNav) provide the single navigation.
  return <>{children}</>
}
