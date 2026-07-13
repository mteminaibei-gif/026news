import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type UserProfile = { name: string; profile_image: string | null; role: string }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login?error=login_required&redirect=/admin/dashboard')

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
      <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
        {/* Collapsible Sidebar */}
        <Sidebar
          role="admin"
          user={{ name: profile.name, profile_image: profile.profile_image }}
        />
        
        {/* Main content area - responsive with dynamic margin */}
        <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-16 lg:ml-64">
          {children}
        </div>
      </div>
    )
  } catch {
    redirect('/login?error=login_required&redirect=/admin/dashboard')
  }
}
