'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ChatWidget } from '@/components/layout/ChatWidget'

const HIDE_NAV_ROUTES = ['/admin', '/journalist', '/explore']

export function LayoutNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const hideNav = HIDE_NAV_ROUTES.some(r => pathname.startsWith(r))

  if (hideNav) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      <Footer />
      <ChatWidget />
    </>
  )
}
