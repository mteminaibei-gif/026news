import { createClient } from '@/lib/supabase/server'

interface ScoredArticle {
  article_id: number
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  views: number
  created_at: string
  author_id: number | null
  category_id: number | null
  tags: string[]
  score: number
  author?: { name: string; profile_image: string | null } | null
  category?: { name: string } | null
}

interface UserActivity {
  likedArticleIds: number[]
  savedArticleIds: number[]
  commentedArticleIds: number[]
  viewedArticleIds: number[]
  categoryCounts: Map<number, number>
  tagCounts: Map<string, number>
  authorCounts: Map<number, number>
}

export async function getRecommendations(userId: number, limit = 10): Promise<ScoredArticle[]> {
  const supabase = await createClient()

  // Fetch user activity in parallel
  const [likedRes, savedRes, commentedRes] = await Promise.all([
    (supabase as any)
      .from('article_likes')
      .select('article_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
    (supabase as any)
      .from('saved_articles')
      .select('article_id')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .limit(100),
    (supabase as any)
      .from('comments')
      .select('article_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const likedArticleIds: number[] = (likedRes.data ?? []).map((r: any) => r.article_id)
  const savedArticleIds: number[] = (savedRes.data ?? []).map((r: any) => r.article_id)
  const commentedArticleIds: number[] = (commentedRes.data ?? []).map((r: any) => r.article_id)
  const viewedArticleIds = [...new Set([...likedArticleIds, ...savedArticleIds, ...commentedArticleIds])]

  // Build user profile from interacted articles
  const allInteractedIds = [...new Set([...likedArticleIds, ...savedArticleIds, ...commentedArticleIds])]

  if (allInteractedIds.length === 0) {
    return getPopularFallback(supabase, limit)
  }

  // Fetch details of interacted articles
  const { data: interactedArticles } = await (supabase as any)
    .from('articles')
    .select('article_id, category_id, tags, author_id')
    .in('article_id', allInteractedIds)

  const activity = buildActivityProfile(
    interactedArticles ?? [],
    likedArticleIds,
    savedArticleIds,
    commentedArticleIds
  )

  // Fetch candidate articles (published, not interacted with)
  const { data: candidates } = await (supabase as any)
    .from('articles')
    .select('article_id, title, slug, excerpt, featured_image, views, created_at, author_id, category_id, tags, author:users(user_id,name,profile_image), category:categories(name)')
    .eq('status', 'published')
    .not('article_id', 'in', `(${viewedArticleIds.join(',') || '0'})`)
    .order('created_at', { ascending: false })
    .limit(200)

  if (!candidates || candidates.length === 0) {
    return getPopularFallback(supabase, limit)
  }

  // Score each candidate
  const scored = (candidates as any[]).map(article => ({
    ...article,
    score: scoreArticle(article, activity),
  }))

  // Sort by score descending, return top N
  scored.sort((a: any, b: any) => b.score - a.score)

  return scored.slice(0, limit) as ScoredArticle[]
}

function buildActivityProfile(
  articles: { article_id: number; category_id: number | null; tags: string[]; author_id: number | null }[],
  likedIds: number[],
  savedIds: number[],
  commentedIds: number[]
): UserActivity {
  const categoryCounts = new Map<number, number>()
  const tagCounts = new Map<string, number>()
  const authorCounts = new Map<number, number>()

  for (const article of articles) {
    // Categories weighted by interaction type
    if (article.category_id != null) {
      let weight = 1
      if (likedIds.includes(article.article_id)) weight += 2
      if (savedIds.includes(article.article_id)) weight += 3
      if (commentedIds.includes(article.article_id)) weight += 2
      categoryCounts.set(article.category_id, (categoryCounts.get(article.category_id) ?? 0) + weight)
    }

    // Tags
    if (article.tags) {
      for (const tag of article.tags) {
        let weight = 1
        if (likedIds.includes(article.article_id)) weight += 2
        if (savedIds.includes(article.article_id)) weight += 3
        if (commentedIds.includes(article.article_id)) weight += 2
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + weight)
      }
    }

    // Authors
    if (article.author_id != null) {
      let weight = 1
      if (likedIds.includes(article.article_id)) weight += 2
      if (savedIds.includes(article.article_id)) weight += 3
      if (commentedIds.includes(article.article_id)) weight += 2
      authorCounts.set(article.author_id, (authorCounts.get(article.author_id) ?? 0) + weight)
    }
  }

  return {
    likedArticleIds: likedIds,
    savedArticleIds: savedIds,
    commentedArticleIds: commentedIds,
    viewedArticleIds: [...likedIds, ...savedIds, ...commentedIds],
    categoryCounts,
    tagCounts,
    authorCounts,
  }
}

function scoreArticle(
  article: {
    article_id: number
    category_id: number | null
    tags: string[]
    author_id: number | null
    views: number
    created_at: string
  },
  activity: UserActivity
): number {
  let score = 0

  // Category match (weight: 3x)
  if (article.category_id != null && activity.categoryCounts.has(article.category_id)) {
    const count = activity.categoryCounts.get(article.category_id)!
    score += Math.min(count, 10) * 3
  }

  // Tag match (weight: 2x)
  if (article.tags) {
    for (const tag of article.tags) {
      if (activity.tagCounts.has(tag)) {
        const count = activity.tagCounts.get(tag)!
        score += Math.min(count, 10) * 2
      }
    }
  }

  // Recency (weight: 1.5x) — newer articles score higher
  const ageInHours = (Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60)
  const recencyScore = Math.max(0, 1 - ageInHours / (24 * 30)) // Decays over 30 days
  score += recencyScore * 1.5

  // View count popularity (weight: 1x)
  const popularityScore = Math.min(article.views / 10000, 1) // Caps at 10k views
  score += popularityScore * 1

  // Author they've engaged with before (weight: 2x)
  if (article.author_id != null && activity.authorCounts.has(article.author_id)) {
    const count = activity.authorCounts.get(article.author_id)!
    score += Math.min(count, 5) * 2
  }

  return score
}

async function getPopularFallback(supabase: any, limit: number): Promise<ScoredArticle[]> {
  const { data } = await supabase
    .from('articles')
    .select('article_id, title, slug, excerpt, featured_image, views, created_at, author_id, category_id, tags, author:users(user_id,name,profile_image), category:categories(name)')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(limit)

  return (data ?? []) as ScoredArticle[]
}
