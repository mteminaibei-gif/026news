'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function JournalistDashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.push('/journalist/profile')
  }, [router])

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
    </div>
  )
}