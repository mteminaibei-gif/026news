import type { Metadata, Viewport } from 'next'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { CookieConsent } from '@/components/ui/CookieConsent'
import { Analytics } from '@vercel/analytics/next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://026news.vercel.app'

export const viewport: Viewport = {
  themeColor: '#1a5c2a',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: '026NEW Blog — Kenya Breaking News, Analysis & Journalism',
    template: '%s | 026NEW Blog',
  },
  description:
    'Kenya\'s premier digital news platform. Breaking news, in-depth analysis, and community journalism from Nairobi and across Africa. Politics, Business, Tech, Sports and more.',
  keywords: [
    'Kenya news', 'breaking news Kenya', 'Nairobi news', 'Africa news',
    'Kenya politics', 'Kenya business', 'Kenyan journalism',
    '026new blog', 'news platform Kenya', 'freelance journalists Kenya',
    'tech news Africa', 'sports Kenya',
  ],
  authors: [{ name: '026NEW Blog Editorial Team', url: APP_URL }],
  creator: '026NEW Blog',
  publisher: '026NEW Blog',
  category: 'news',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: APP_URL,
    siteName: '026NEW Blog',
    title: '026NEW Blog — Kenya Breaking News & Analysis',
    description: 'Breaking news and in-depth analysis from Kenya and across Africa.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: '026NEW Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '026NEW Blog — Kenya Breaking News',
    description: 'Breaking news, freelance journalism, and analysis from Kenya and Africa.',
    images: ['/og-image.svg'],
    creator: '@026newsblog',
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple:   '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  alternates: { canonical: APP_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 transition-colors duration-300">
        <ThemeProvider>
          <QueryProvider>
            {children}
            <CookieConsent />
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
