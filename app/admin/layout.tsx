import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type UserProfile = { name: string; profile_image: string | null; role: string }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex min-h-screen bg-gradient-to-br from-[#f0faf2] via-white to-[#fff8e1]">
      {/* Sidebar - Hidden on mobile, fixed on desktop */}
      <div className="hidden md:block">
        <Sidebar
          role="admin"
          user={{ name: profile.name, profile_image: profile.profile_image }}
        />
      </div>
      
      {/* Main content area - responsive */}
      <div className="flex-1 flex flex-col min-h-screen w-full md:ml-0">
        {children}
      </div>
    </div>
  )
}
