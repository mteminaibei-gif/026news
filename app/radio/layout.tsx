import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Radio',
  description: 'Listen to live radio streams from Kenya and around the world. News, music, talk shows, and podcasts — stream online for free.',
  openGraph: {
    title: 'Radio — 026connet!',
    description: 'Listen to live radio streams from Kenya and around the world. News, music, talk shows, and podcasts.',
    siteName: '026connet!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Radio — 026connet!',
    description: 'Listen to live radio streams from Kenya and around the world.',
  },
}

export default function RadioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
