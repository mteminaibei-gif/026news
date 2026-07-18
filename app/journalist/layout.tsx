import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { ChatWidget } from '@/components/layout/ChatWidget'

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
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Topbar title="Journalist" user={{ name: profile.name, profile_image: profile.profile_image }} />
      <div className="flex-1">
        {children}
      </div>
      <ChatWidget />
    </div>
  )
}
