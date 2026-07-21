import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Social Feed',
  description: 'Join the conversation on 026connet!. Post thoughts, follow journalists, debate stories, and connect with the Kenya news community.',
  openGraph: {
    title: 'Social Feed — 026connet!',
    description: 'Join the conversation on 026connet!. Post thoughts, follow journalists, debate stories, and connect with the Kenya news community.',
    siteName: '026connet!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Feed — 026connet!',
    description: 'Join the conversation on 026connet!. Post thoughts, follow journalists, debate stories.',
  },
}

export default async function SocialLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?error=login_required&redirect=/social')

  return <>{children}</>
}
