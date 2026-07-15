import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'

type UserProfile = { name: string; profile_image: string | null; role: string }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login?error=login_required&redirect=/admin/profile')

    const { data: rawProfile } = await supabase
      .from('users')
      .select('name, profile_image, role')
      .eq('email', user.email ?? '')
      .single()

    const profile = rawProfile as unknown as UserProfile | null

    if (!profile || profile.role !== 'admin') {
      redirect('/login?error=unauthorized')
    }

    return (
      <div className="flex-1 flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <Topbar title="Admin" user={{ name: profile.name, profile_image: profile.profile_image }} />
        <div className="flex-1">
          {children}
        </div>
      </div>
    )
  } catch {
    redirect('/login?error=login_required&redirect=/admin/profile')
  }
}
