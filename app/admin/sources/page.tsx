import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { AdminSourcesClient } from '@/components/admin/AdminSourcesClient'

export const metadata: Metadata = { title: 'News Sources — Admin Panel' }
export const dynamic = 'force-dynamic'

type FeedRow = {
  feed_id:      number
  name:         string
  feed_url:     string
  is_active:    boolean
  last_fetched: string | null
  last_error:   string | null
  fetch_count:  number
  category:     { name: string } | null
}

type Category = { category_id: number; name: string }

export default async function AdminSourcesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase
    .from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  const [{ data: rawFeeds }, { data: rawCats }] = await Promise.all([
    supabase
      .from('rss_feeds')
      .select('feed_id, name, feed_url, is_active, last_fetched, last_error, fetch_count, category:categories(name)')
      .order('name'),
    supabase
      .from('categories')
      .select('category_id, name')
      .order('name'),
  ])

  const feeds      = (rawFeeds ?? []) as unknown as FeedRow[]
  const categories = (rawCats  ?? []) as unknown as Category[]

  return (
    <div className="p-6 flex-1">
      <AdminSourcesClient feeds={feeds} categories={categories} />
    </div>
  )
}
