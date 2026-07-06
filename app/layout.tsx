import type { Metadata, Viewport } from 'next'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { CookieConsent } from '@/components/ui/CookieConsent'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://026news.vercel.app'

export const viewport: Viewport = {
  themeColor: '#0a1628',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: '026News — Breaking News, Freelance Journalism & Analysis',
    template: '%s | 026News',
  },
  description:
    'Breaking news, in-depth analysis, and award-winning freelance journalism from Africa and the world. Stay informed with 026News — your trusted source for politics, business, tech, science, and more.',
  keywords: [
    'breaking news', 'Africa news', 'freelance journalism', 'Kenya news',
    'tech news', 'business news', 'politics', 'science news', 'sports',
    '026news', 'news platform', 'journalists',
  ],
  authors: [{ name: '026News Editorial Team', url: APP_URL }],
  creator: '026News',
  publisher: '026News',
  category: 'news',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: '026News',
    title: '026News — Breaking News, Freelance Journalism & Analysis',
    description: 'Breaking news and in-depth analysis from Africa and the world.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: '026News' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '026News — Breaking News & Journalism',
    description: 'Breaking news, freelance journalism, and analysis from Africa and the world.',
    images: ['/og-image.svg'],
    creator: '@026news',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  alternates: { canonical: APP_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <QueryProvider>
          {children}
          <CookieConsent />
        </QueryProvider>
      </body>
    </html>
  )
}
