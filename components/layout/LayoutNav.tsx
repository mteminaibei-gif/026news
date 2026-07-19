'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileTabBar } from '@/components/layout/MobileTabBar'

const HIDE_NAV_ROUTES = ['/admin', '/journalist']

export function LayoutNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const hideNav = HIDE_NAV_ROUTES.some(r => pathname.startsWith(r))

  if (hideNav) {
    return <>{children}</>
  }

  return (
    <>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, alignSelf: 'flex-start', width: '100%' }}>
        <Navbar />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      <Footer />
      <MobileTabBar />
    </>
  )
}
