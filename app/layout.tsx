import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Space_Grotesk, Newsreader } from 'next/font/google';
// import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { RealtimeShell } from '@/components/providers/RealtimeShell';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { RadioProvider } from '@/components/radio/RadioProvider';
import { TVGlobalProvider } from '@/components/tv/TVGlobalProvider';
import { LayoutNav } from '@/components/layout/LayoutNav';
import { PushSubscriptionManager } from '@/components/providers/PushSubscriptionManager';
import { PushProvider } from '@/components/providers/PushProvider';
import { ToastProvider } from '@/components/ui/Toast';
import StyledJsxRegistry from './registry';
import { APP_URL } from '@/lib/constants/app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: '026connet! — Breaking News, Analysis & Freelance Journalism from Kenya',
    template: '%s — 026connet!',
  },
  description:
    "Kenya's digital news platform for breaking news, in-depth analysis, opinion and award-winning freelance journalism from across Africa and the world.",
  applicationName: '026connet!',
  authors: [{ name: '026connet!' }],
  creator: '026connet!',
  publisher: '026connet!',
  category: 'news',
  keywords: [
    'Kenya news', 'breaking news', 'journalism', 'freelance journalism',
    'African news', 'news analysis', 'opinion', '026connet!',
  ],
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': '/feed' },
  },
  openGraph: {
    type: 'website',
    siteName: '026connet!',
    title: '026connet! — Breaking News, Analysis & Freelance Journalism from Kenya',
    description:
      "Kenya's digital news platform for breaking news, in-depth analysis and award-winning freelance journalism.",
    url: '/',
    locale: 'en_KE',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: '026connet!' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '026connet! — Breaking News, Analysis & Freelance Journalism from Kenya',
    description:
      "Kenya's digital news platform for breaking news, in-depth analysis and award-winning freelance journalism.",
    images: ['/og-image.svg'],
    site: '@026connet!',
    creator: '@026connet!',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#e23b3b',
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
}

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-scroll-behavior="smooth" className={`h-full antialiased ${spaceGrotesk.variable} ${newsreader.variable}`}>
      <body className="min-h-full flex flex-col font-sans" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <ToastProvider>
            <QueryProvider>
            <RealtimeShell>
              <RadioProvider>
                <TVGlobalProvider>
                  <PushProvider>
                  <StyledJsxRegistry>
                    <LayoutNav>
                      {children}
                    </LayoutNav>
                    <CookieConsent />
                  </StyledJsxRegistry>
                  </PushProvider>
                </TVGlobalProvider>
              </RadioProvider>
            </RealtimeShell>
          </QueryProvider>
          </ToastProvider>
        </ThemeProvider>
        {/* Analytics disabled - CSP conflict */}
        {/* <Analytics /> */}
        <PushSubscriptionManager />
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
