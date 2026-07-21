import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live TV',
  description: 'Watch live TV streams from Kenya, Africa, and global news networks. Citizen TV, NTV, BBC, CNN, Al Jazeera, and more — all in one place.',
  openGraph: {
    title: 'Live TV — 026connet!',
    description: 'Watch live TV streams from Kenya, Africa, and global news networks — Citizen TV, NTV, BBC, CNN, Al Jazeera, and more.',
    siteName: '026connet!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live TV — 026connet!',
    description: 'Watch live TV streams from Kenya, Africa, and global news networks.',
  },
}

export default function TvLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
