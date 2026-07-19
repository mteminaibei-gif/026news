import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { MobileDrawerNav } from '@/components/layout/MobileDrawerNav'

type UserProfile = { user_id: number; name: string; profile_image: string | null; role: string }

const ADMIN_MOBILE_NAV = [
  {
    section: 'Manage',
    items: [
      { href: '/admin', label: 'Overview', icon: '🎨' },
      { href: '/admin/articles', label: 'Articles', icon: '📝' },
      { href: '/admin/journalists', label: 'Authors', icon: '👥' },
      { href: '/admin/users', label: 'Users', icon: '👤' },
      { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
      { href: '/admin/sources', label: 'Sources', icon: '🔗' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: '📊' },
      { href: '/admin/earnings', label: 'Earnings', icon: '💰' },
      { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
      { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
    ],
  },
  {
    section: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
]

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

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Topbar
          title="Admin"
          user={{ name: profile.name, profile_image: profile.profile_image }}
          notifications={{ userId: profile.user_id, role: 'admin' }}
          mobileNav={{
            title: 'Admin',
            groups: ADMIN_MOBILE_NAV,
            baseHref: '/admin',
            logoutHref: '/admin?logout=true',
          }}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
  } catch {
    redirect('/login?error=login_required&redirect=/admin')
  }
}
