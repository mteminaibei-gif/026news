import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type UserProfile = { user_id: number; name: string; profile_image: string | null; role: string }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login?error=login_required&redirect=/admin')

    const { data: rawProfile } = await supabase
      .from('users')
      .select('user_id, name, profile_image, role')
      .eq('auth_id', user.id)
      .single()

    const profile = rawProfile as unknown as UserProfile | null

    if (!profile || profile.role !== 'admin') {
      redirect('/login?error=unauthorized')
    }

    // Global app rail + navbar (LayoutNav) provide the single navigation.
    return <>{children}</>
  } catch {
    redirect('/login?error=login_required&redirect=/admin')
  }
}
