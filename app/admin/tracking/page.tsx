import type { Metadata } from 'next'
import { TrackingDashboard } from '@/components/admin/TrackingDashboard'

export const metadata: Metadata = { title: 'Live Traffic & Ads — Admin' }

export default function TrackingPage() {
  const secret = process.env.ADMIN_SECRET ?? ''
  return (
    <div className="p-3 sm:p-6 flex-1" style={{ background: 'var(--bg-base)' }}>
      <TrackingDashboard secret={secret} />
    </div>
  )
}
