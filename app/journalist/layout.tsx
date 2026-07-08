import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type UserProfile = { name: string; profile_image: string | null; role: string }

export default async function JournalistLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?error=login_required&redirect=/journalist/dashboard')

  const { data: rawProfile } = await supabase
    .from('users')
    .select('name, profile_image, role')
    .eq('email', user.email ?? '')
    .single()

  const profile = rawProfile as unknown as UserProfile | null

  if (!profile || profile.role !== 'journalist') {
    redirect('/login?error=unauthorized')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role="journalist"
        user={{ name: profile.name, profile_image: profile.profile_image }}
      />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}
