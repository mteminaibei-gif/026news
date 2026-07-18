import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore — 026connet!',
  description: 'Discover articles by category, topic, and trending discussions. Dive into curated content across politics, business, tech, sports, and more.',
  openGraph: {
    title: 'Explore — 026connet!',
    description: 'Discover articles by category, topic, and trending discussions. Dive into curated content across politics, business, tech, sports, and more.',
    siteName: '026connet!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore — 026connet!',
    description: 'Discover articles by category, topic, and trending discussions.',
  },
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
