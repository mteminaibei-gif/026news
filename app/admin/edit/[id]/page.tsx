import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { AdminArticleEditor } from '@/components/admin/AdminArticleEditor'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Edit Article — Admin Panel' }

type ArticleRow = {
  article_id: number
  title: string
  content: string
  excerpt: string | null
  category_id: number | null
  featured_image: string | null
  monetization_type: string
  status: string
  source_reference: string | null
  author_id: number | null
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Auth
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase
    .from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  // Fetch article
  const { data: rawArticle, error } = await supabase
    .from('articles')
    .select('article_id, title, content, featured_image, monetization_type, status, source_reference, category_id, author_id')
    .eq('article_id', Number(id))
    .single()

  if (error || !rawArticle) notFound()

  const article = rawArticle as unknown as ArticleRow

  return (
    <>
      <Topbar
        title="Edit Article"
        user={{ name: admin?.name ?? 'Admin', profile_image: admin?.profile_image ?? null }}
      >
        <Link
          href="/admin/articles"
          className="text-sm font-semibold bg-[#f0faf2] hover:bg-[#e0f5e4] text-[#1a5c2a] px-3 py-1.5 rounded-xl transition-all duration-300"
        >
          ← All Articles
        </Link>
      </Topbar>

      <div className="p-6 flex-1">
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
        />
      </div>
    </>
  )
}
