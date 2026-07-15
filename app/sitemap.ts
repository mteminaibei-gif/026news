import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { APP_URL } from '@/lib/constants/app'

type ArticleRow = { slug: string; updated_at: string }
type CategoryRow = { name: string }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Fetch all published articles
  const { data: rawArticles } = await supabase
    .from('articles')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(5000)
  const articles = (rawArticles ?? []) as unknown as ArticleRow[]

  // Fetch all categories
  const { data: rawCategories } = await supabase
    .from('categories')
    .select('name')
  const categories = (rawCategories ?? []) as unknown as CategoryRow[]

  const now = new Date()

  return [
    // Home
    {
      url: APP_URL,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    // Static pages
    {
      url: `${APP_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${APP_URL}/journalists`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/leaderboard`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${APP_URL}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Category pages
    ...categories.map(cat => ({
      url: `${APP_URL}/?category=${encodeURIComponent(cat.name)}`,
      lastModified: now,
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    })),
    // Articles
    ...articles.map(article => ({
      url: `${APP_URL}/article/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ]
}
