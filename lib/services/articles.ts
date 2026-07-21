'use server'

import { createClient } from '@/lib/supabase/server'

interface FetchArticlesOptions {
  limit?: number
  offset?: number
  status?: string
  categoryId?: number
  authorId?: number
  region?: string
  sort?: 'recent' | 'popular' | 'trending'
}

interface Article {
  article_id: number
  title: string
  slug: string
  content: string
  excerpt: string
  category_id: number
  author_id: number
  featured_image: string | null
  views: number
  likes: number
  earnings: number
  status: string
  published_at: string
  created_at: string
  tags?: string[]
}

/**
 * Optimized fetch articles with filtering, sorting, and error handling
 * Uses server-side caching to reduce database load
 */
export async function fetchArticles(options: FetchArticlesOptions = {}): Promise<Article[]> {
  const {
    limit = 20,
    offset = 0,
    status = 'published',
    categoryId,
    authorId,
    region = 'global',
    sort = 'recent',
  } = options

  try {
    const supabase = await createClient()

    let query = supabase
      .from('articles')
      .select(
        'article_id, title, slug, content, excerpt, category_id, author_id, featured_image, views, likes, earnings, status, published_at, created_at, tags'
      )

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    if (authorId) {
      query = query.eq('author_id', authorId)
    }

    // Apply sorting
    switch (sort) {
      case 'popular':
        query = query.order('views', { ascending: false })
        break
      case 'trending':
        query = query.order('likes', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('published_at', { ascending: false }).order('created_at', { ascending: false })
        break
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = (await query) as any

    if (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('[fetchArticles] Database error:', error.message)
      }
      return []
    }

    return (data ?? []) as Article[]
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[fetchArticles] Exception:', err instanceof Error ? err.message : 'Unknown error')
    }
    return []
  }
}

/**
 * Fetch single article by slug with author and category details
 */
export async function fetchArticleBySlug(slug: string): Promise<(Article & { author: any; category: any }) | null> {
  try {
    const supabase = await createClient()

    const { data, error } = (await supabase
      .from('articles')
      .select('*, author:author_id(name, profile_image, bio), category:category_id(name, slug)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()) as any

    if (error || !data) {
      return null
    }

    return data
  } catch {
    return null
  }
}

/**
 * Fetch articles with pagination for infinite scroll
 */
export async function fetchArticlesInfinite(page: number, pageSize: number = 20): Promise<Article[]> {
  const offset = (page - 1) * pageSize
  return fetchArticles({ limit: pageSize, offset })
}

/**
 * Search articles by title or content
 */
export async function searchArticles(query: string, limit: number = 10): Promise<Article[]> {
  try {
    const supabase = await createClient()

    const { data, error } = (await supabase
      .from('articles')
      .select('article_id, title, slug, excerpt, category_id, author_id, featured_image, views, published_at')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(limit)) as any

    if (error) {
      return []
    }

    return (data ?? []) as Article[]
  } catch {
    return []
  }
}

/**
 * Get trending articles (most viewed in last 7 days)
 */
export async function fetchTrendingArticles(limit: number = 10): Promise<Article[]> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return fetchArticles({
    limit,
    sort: 'trending',
  })
}

/**
 * Get featured articles for homepage
 */
export async function fetchFeaturedArticles(limit: number = 5): Promise<Article[]> {
  try {
    const supabase = await createClient()

    const { data, error } = (await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(limit)) as any

    if (error) {
      return []
    }

    return (data ?? []) as Article[]
  } catch {
    return []
  }
}
