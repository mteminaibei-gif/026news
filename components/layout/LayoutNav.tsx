'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MessagesSidebar } from '@/components/layout/MessagesSidebar'

const HIDE_NAV_PATTERNS = [
  '/admin',
  '/journalist',
]

export function LayoutNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = HIDE_NAV_PATTERNS.some(p => pathname.startsWith(p))

  return (
    <>
      {!hideNav && <Navbar />}
      <div className="lg:pr-[372px]" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      {!hideNav && <Footer />}
      {!hideNav && <MessagesSidebar />}
    </>
  )
}
