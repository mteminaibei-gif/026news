import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { JournalistArticlesClient } from './JournalistArticlesClient'

export const metadata: Metadata = {
  title: 'My Articles — Author Portal',
  description: 'Manage and track all your submitted articles on 026NEWS.',
}

export default async function JournalistArticlesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('user_id, name, role, profile_image').eq('email', user.email ?? '').single()
  if (!profile || (profile as { role: string }).role !== 'journalist') redirect('/login')

  const { data: articles } = await supabase
    .from('articles')
    .select('article_id, title, slug, status, views, created_at, featured_image, category:categories(name)')
    .eq('author_id', (profile as { user_id: number }).user_id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <JournalistArticlesClient
          articles={(articles ?? []) as unknown as Array<{
            article_id: number; title: string; slug: string; status: string;
            views: number; created_at: string; featured_image: string | null;
            category: { name: string } | null
          }>}
          userName={(profile as { name: string }).name}
        />
      </main>
    </div>
  )
}
