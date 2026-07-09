import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminArticleEditor } from '@/components/admin/AdminArticleEditor'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Edit Article — Admin Panel' }

type ArticleRow = {
  article_id: number; title: string; content: string
  excerpt: string | null; category_id: number | null
  featured_image: string | null; monetization_type: string
  status: string; source_reference: string | null; author_id: number | null
}

interface Props { params: Promise<{ id: string }> }

export default async function AdminEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase
    .from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  const { data: rawArticle, error } = await supabase
    .from('articles')
    .select('article_id, title, content, excerpt, featured_image, monetization_type, status, source_reference, category_id, author_id')
    .eq('article_id', Number(id))
    .single()

  if (error || !rawArticle) notFound()
  const article = rawArticle as unknown as ArticleRow

  return (
    <div className="flex-1">
      <AdminArticleEditor
        initialData={{
          article_id:        article.article_id,
          title:             article.title,
          content:           article.content,
          excerpt:           article.excerpt ?? null,
          category_id:       article.category_id,
          featured_image:    article.featured_image,
          monetization_type: article.monetization_type,
          status:            article.status,
          source_reference:  article.source_reference,
          author_id:         article.author_id,
        }}
        redirectTo="/admin/articles"
        adminName={admin?.name ?? 'Admin'}
        adminImage={admin?.profile_image ?? null}
        backLabel="← Articles"
        backHref="/admin/articles"
      />
    </div>
  )
}
