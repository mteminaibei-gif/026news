import { Sidebar } from '@/components/layout/Sidebar'
import { MOCK_USERS } from '@/lib/mock-data'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = MOCK_USERS[1] // Admin User

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" user={{ name: admin.name, profile_image: admin.profile_image }} />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}
