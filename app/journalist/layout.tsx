import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { ChatWidget } from '@/components/layout/ChatWidget'
import { JournalistSidebar } from '@/components/journalist/JournalistSidebar'

type UserProfile = { name: string; profile_image: string | null; role: string }

export default async function JournalistLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?error=login_required&redirect=/journalist/profile')

  const { data: rawProfile } = await supabase
    .from('users')
    .select('name, profile_image, role')
    .eq('auth_id', user.id)
    .single()

  const profile = rawProfile as unknown as UserProfile | null

  if (!profile || profile.role !== 'journalist') {
    redirect('/login?error=unauthorized')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <JournalistSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Journalist" user={{ name: profile.name, profile_image: profile.profile_image }} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}
