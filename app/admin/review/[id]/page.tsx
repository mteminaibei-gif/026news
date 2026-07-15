import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { AdminReviewClient } from '@/components/admin/AdminReviewClient'

export const metadata: Metadata = { title: 'Review Article — Admin Panel' }
export const dynamic = 'force-dynamic'

type ArticleRow = {
  article_id: number
  title: string
  content: string
  slug: string
  status: string
  monetization_type: string
  featured_image: string | null
  source_reference: string | null
  created_at: string
  views: number
  author: {
    user_id: number
    name: string
    profile_image: string | null
    bio: string | null
  } | null
  category: { name: string } | null
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Admin identity
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase
    .from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  // Fetch the article with joins
  const { data: rawArticle, error } = await supabase
    .from('articles')
    .select(`
      article_id, title, content, slug, status, monetization_type,
      featured_image, source_reference, created_at, views,
      author:users(user_id, name, profile_image, bio),
      category:categories(name)
    `)
    .eq('article_id', Number(id))
    .single()

  if (error || !rawArticle) notFound()

  const article = rawArticle as unknown as ArticleRow

  // How many articles has the author published?
  let authorArticleCount = 0
  if (article.author?.user_id) {
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', article.author.user_id)
      .eq('status', 'published')
    authorArticleCount = count ?? 0
  }

  return (
    <div className="p-6 flex-1">
      <AdminReviewClient
        article={article}
        authorArticleCount={authorArticleCount}
      />
    </div>
  )
}
