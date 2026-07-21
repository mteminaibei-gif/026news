import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Communities',
  description: 'Join topic-based communities on 026connet!. From politics to tech, find your tribe and share perspectives on the news that matters.',
}

export default function CommunitiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
