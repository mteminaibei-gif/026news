'use client'

import { useState, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Footer } from '@/components/layout/Footer'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { GuidedTour } from '@/components/tour/GuidedTour'
import { usePresence } from '@/lib/hooks/usePresence'
import { useUser } from '@/lib/hooks/useAuth'
import { useProfile } from '@/lib/hooks/useAuth'
import { useSettings } from '@/components/providers/SettingsProvider'
import { usePageView } from '@/lib/hooks/useTracking'

function hasOwnChrome(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/verify-email')
  )
}

function isLandingPage(pathname: string): boolean {
  return pathname === '/'
}

export function LayoutNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  usePresence()
  useSettings()
  usePageView(pathname)

  if (hasOwnChrome(pathname)) {
    return <>{children}</>
  }

  // Landing page: content only — the page renders its own nav/hero/footer
  if (isLandingPage(pathname)) {
    return <>{children}</>
  }

  const isAuthenticated = !!user

  return (
    <div className="app-layout">
      <Navbar onMenu={() => setMobileOpen(v => !v)} />
      <div className="app-body">
        {isAuthenticated && <Suspense><AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /></Suspense>}
        <main className="app-content">
          {children}
        </main>
      </div>
      <Footer />
      {isAuthenticated && <MobileTabBar />}
      {isAuthenticated && profile && (profile.role === 'reader' || profile.role === 'journalist' || profile.role === 'admin') && (
        <GuidedTour role={profile.role === 'reader' ? 'reader' : 'journalist'} />
      )}
    </div>
  )
}
