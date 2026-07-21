import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'

export const metadata: Metadata = { title: 'Platform Analytics — Admin Panel' }

type ArticleRow = {
  article_id: number; title: string; slug: string; views: number; earnings: number
  featured_image: string | null; created_at: string
  author: { name: string } | null; category: { name: string } | null
}
type EarnRow   = { amount: number; source: string; created_at: string }
type UserRow   = { user_id: number; created_at: string; role: string }

export default async function AdminAnalyticsPage() {
  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    return (
      <div className="p-6 flex-1" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center py-16" style={{ color: 'var(--text-tertiary)' }}>
          <p className="text-lg font-semibold mb-2">Unable to connect to database</p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase.from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  const safeCount = async (table: string, eq?: { col: string; val: string }) => {
    try {
      let q = (supabase.from(table as never) as any).select('id', { count: 'exact', head: true })
      if (eq) q = q.eq(eq.col, eq.val)
      const { count } = await q
      return count ?? 0
    } catch {
      return 0
    }
  }

  const [totalArticles, totalUsers, totalJournalists] = await Promise.all([
    safeCount('articles', { col: 'status', val: 'published' }),
    safeCount('users'),
    safeCount('users', { col: 'role', val: 'journalist' }),
  ])

  const safeQuery = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn() } catch { return fallback }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emptyResponse = { data: [], error: null, count: null, status: 200, statusText: 'OK', success: true } as any

  const rawTopArticles = await safeQuery(async () => {
    const r = await supabase.from('articles').select('article_id, title, slug, views, earnings, featured_image, created_at, author:users(name), category:categories(name)').eq('status', 'published' as never).order('views', { ascending: false }).limit(10)
    return r
  }, emptyResponse)
  const rawEarnings = await safeQuery(async () => {
    const r = await supabase.from('earnings').select('amount, source, created_at').order('created_at', { ascending: false }).limit(500)
    return r
  }, emptyResponse)
  const rawNewUsers = await safeQuery(async () => {
    const r = await supabase.from('users').select('user_id, created_at, role').order('created_at', { ascending: false }).limit(200)
    return r
  }, emptyResponse)

  const topArticles = (rawTopArticles.data ?? []) as unknown as ArticleRow[]
  const earnings = (rawEarnings.data ?? []) as unknown as EarnRow[]
  const newUsers = (rawNewUsers.data ?? []) as unknown as UserRow[]

  const { data: allArticles } = await supabase
    .from('articles')
    .select('views')
    .eq('status', 'published')
  const totalViews = (allArticles ?? []).reduce((s: number, a: any) => s + (a.views ?? 0), 0)
  const totalRevenue = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthRevenue = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)

  return (
    <AnalyticsDashboard
      initialTopArticles={topArticles}
      initialEarnings={earnings}
      initialNewUsers={newUsers}
      initialTotalArticles={totalArticles}
      initialTotalUsers={totalUsers}
      initialTotalJournalists={totalJournalists}
      initialTotalViews={totalViews}
      initialTotalRevenue={totalRevenue}
      initialMonthRevenue={monthRevenue}
    />
  )
}
