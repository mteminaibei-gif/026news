'use client'

import { RealtimeProvider } from '@/components/providers/RealtimeProvider'
import { useUser, useProfile } from '@/lib/hooks/useAuth'

export function RealtimeShell({ children }: { children: React.ReactNode }) {
  const { data: user } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)

  return (
    <RealtimeProvider userId={profile?.user_id}>
      {children}
    </RealtimeProvider>
  )
}
