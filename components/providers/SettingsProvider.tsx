'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useRealtimeSettings } from '@/lib/hooks/useRealtimeSettings'

interface SettingsContextValue {
  settings: Record<string, any>
  loading: boolean
  getSetting: (key: string) => any
  getSection: (section: string) => Record<string, any>
  refetch: () => Promise<void>

  // Convenience accessors
  siteName: string
  tagline: string
  siteUrl: string
  contactEmail: string
  supportEmail: string
  logoUrl: string
  favicon: string
  primaryColor: string
  accentColor: string
  defaultTheme: string
  openRegistration: boolean
  emailVerification: boolean
  googleOauth: boolean
  githubOauth: boolean
  inviteOnly: boolean
  articlesPerPage: number
  revenueShare: number
  minPayout: number
  breakingTicker: boolean
  heroSlideshow: boolean
  trendingSidebar: boolean
  newsletterWidget: boolean
  rssFeedSection: boolean
  chatWidget: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settings, loading, getSetting, getSection, refetch } = useRealtimeSettings()

  const general = getSection('general') as Record<string, any>
  const appearance = getSection('appearance') as Record<string, any>
  const monetization = getSection('monetization') as Record<string, any>

  const value: SettingsContextValue = {
    settings,
    loading,
    getSetting,
    getSection,
    refetch,

    siteName: general.site_name ?? '026connet!',
    tagline: general.tagline ?? "Kenya's Premier Digital News Platform",
    siteUrl: general.app_url ?? '',
    contactEmail: general.contact_email ?? '',
    supportEmail: general.support_email ?? '',
    logoUrl: general.site_logo ?? '',
    favicon: general.favicon ?? '',
    primaryColor: appearance.primary_color ?? '#1a8a6e',
    accentColor: appearance.accent_color ?? '#f97316',
    defaultTheme: appearance.default_theme ?? 'Light',
    openRegistration: general.open_registration ?? true,
    emailVerification: general.email_verification ?? true,
    googleOauth: general.google_oauth ?? true,
    githubOauth: general.github_oauth ?? true,
    inviteOnly: general.invite_only ?? false,
    articlesPerPage: appearance.articles_per_page ?? 10,
    revenueShare: monetization.revenue_share ?? 70,
    minPayout: monetization.min_payout ?? 50,
    breakingTicker: appearance.breaking_ticker ?? true,
    heroSlideshow: appearance.hero_slideshow ?? true,
    trendingSidebar: appearance.trending_sidebar ?? true,
    newsletterWidget: appearance.newsletter_widget ?? true,
    rssFeedSection: appearance.rss_feed_section ?? true,
    chatWidget: appearance.chat_widget ?? true,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
