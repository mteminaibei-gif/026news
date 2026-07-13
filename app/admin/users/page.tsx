import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { getCurrentAdmin } from '@/lib/server-auth'

export const metadata: Metadata = {
  title: 'Users Management — Admin Panel',
}

export default async function AdminUsersPage() {
  const admin = await getCurrentAdmin()
  const user = {
    name: admin?.name ?? 'Admin',
    profile_image: null as string | null,
    user_id: 1,
    role: 'admin' as const,
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Topbar title="Users Management" user={user} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <UserManagementTable />
      </main>
    </div>
  )
}
