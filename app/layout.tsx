import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Newsreader } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { RadioProvider } from '@/components/radio/RadioProvider';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://026news.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: '026Newsblog — Breaking News, Analysis & Freelance Journalism from Kenya',
    template: '%s — 026Newsblog',
  },
  description:
    "Kenya's digital news platform for breaking news, in-depth analysis, opinion and award-winning freelance journalism from across Africa and the world.",
  applicationName: '026Newsblog',
  authors: [{ name: '026Newsblog' }],
  creator: '026Newsblog',
  publisher: '026Newsblog',
  category: 'news',
  keywords: [
    'Kenya news', 'breaking news', 'journalism', 'freelance journalism',
    'African news', 'news analysis', 'opinion', '026Newsblog',
  ],
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': '/feed' },
  },
  openGraph: {
    type: 'website',
    siteName: '026Newsblog',
    title: '026Newsblog — Breaking News, Analysis & Freelance Journalism from Kenya',
    description:
      "Kenya's digital news platform for breaking news, in-depth analysis and award-winning freelance journalism.",
    url: '/',
    locale: 'en_KE',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: '026Newsblog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '026Newsblog — Breaking News, Analysis & Freelance Journalism from Kenya',
    description:
      "Kenya's digital news platform for breaking news, in-depth analysis and award-winning freelance journalism.",
    images: ['/og-image.svg'],
    site: '@026news',
    creator: '@026news',
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
    <html lang="en" data-theme="light" className={`h-full antialiased ${spaceGrotesk.variable} ${newsreader.variable}`}>
      <body className="min-h-full flex flex-col font-sans" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <QueryProvider>
            <RadioProvider>
              {children}
              <CookieConsent />
            </RadioProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
