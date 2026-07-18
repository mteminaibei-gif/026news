import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News — 026connet!',
  description: 'Stay informed with the latest breaking news, trending stories, and in-depth coverage from Kenya, Africa, and around the world.',
  openGraph: {
    title: 'News — 026connet!',
    description: 'Stay informed with the latest breaking news, trending stories, and in-depth coverage from Kenya, Africa, and around the world.',
    siteName: '026connet!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'News — 026connet!',
    description: 'Stay informed with the latest breaking news, trending stories, and in-depth coverage from Kenya, Africa, and around the world.',
  },
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
