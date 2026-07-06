import type { MetadataRoute } from 'next'
import { MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://026news.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${APP_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/journalists`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/subscribe`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${APP_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ]

  // Category pages
  const categories = ['Politics', 'Business', 'Tech', 'Science', 'Sports', 'Entertainment', 'Freelance']
  const categoryPages: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${APP_URL}/?category=${cat}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }))

  // Article pages
  const articlePages: MetadataRoute.Sitemap = MOCK_ARTICLES
    .filter(a => a.status === 'published')
    .map(article => ({
      url: `${APP_URL}/article/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))

  // Journalist profile pages
  const journalistPages: MetadataRoute.Sitemap = MOCK_USERS
    .filter(u => u.role === 'journalist')
    .map(journalist => ({
      url: `${APP_URL}/journalists/${journalist.user_id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [...staticPages, ...categoryPages, ...articlePages, ...journalistPages]
}
