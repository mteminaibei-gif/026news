import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { ChatWidget } from '@/components/layout/ChatWidget'
import { ProfileSidebar } from '@/components/profile/ProfileSidebar'

type UserProfile = { user_id: number; name: string; profile_image: string | null; role: string }

const PROFILE_MOBILE_NAV = [
  {
    section: 'Menu',
    items: [
      { href: '/profile', label: 'My Profile', icon: '👤' },
      { href: '/saved', label: 'Saved Articles', icon: '🔖' },
      { href: '/stats', label: 'Stats', icon: '📊' },
      { href: '/inbox', label: 'Messages', icon: '✉️' },
      { href: '/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
]

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?error=login_required&redirect=/profile')

  const { data: rawProfile } = await supabase
    .from('users')
    .select('user_id, name, profile_image, role')
    .eq('auth_id', user.id)
    .single()

  const profile = rawProfile as unknown as UserProfile | null

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <ProfileSidebar role={profile.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="Profile"
          user={{ name: profile.name, profile_image: profile.profile_image }}
          notifications={{ userId: profile.user_id, role: profile.role }}
          mobileNav={{
            title: 'Profile',
            groups: PROFILE_MOBILE_NAV,
            baseHref: '/profile',
            logoutHref: '/profile?logout=true',
          }}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}
