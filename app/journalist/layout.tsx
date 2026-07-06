import { Sidebar } from '@/components/layout/Sidebar'
import { MOCK_USERS } from '@/lib/mock-data'

export default function JournalistLayout({ children }: { children: React.ReactNode }) {
  const user = MOCK_USERS[0] // Alex Johnson (journalist)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="journalist" user={{ name: user.name, profile_image: user.profile_image }} />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}
