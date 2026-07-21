import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find People',
  description: 'Discover and follow journalists, readers, and creators in the 026connet! community.',
}

export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
