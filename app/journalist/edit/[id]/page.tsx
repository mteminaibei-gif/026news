import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditArticleClient } from './EditArticleClient'

export const metadata: Metadata = {
  title: 'Edit Article — Author Portal',
  description: 'Edit your article draft on 026NEWS.',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('user_id, role').eq('email', user.email ?? '').single()
  if (!profile || (profile as { role: string }).role !== 'journalist') redirect('/login')

  const adminDb = await import('@/lib/supabase/server').then(m => m.createAdminClient())
  const { data: article } = await adminDb
    .from('articles')
    .select('article_id, title, slug, content, excerpt, status, featured_image, tags, category_id, author_id, source_reference, monetization_type')
    .eq('article_id', Number(id))
    .single()

  if (!article) redirect('/journalist/articles')
  const articleData = article as unknown as { author_id: number; status: string }
  if (articleData.author_id !== (profile as { user_id: number }).user_id) redirect('/journalist/articles')
  if (articleData.status === 'published') redirect('/journalist/articles')

  const { data: categories } = await adminDb
    .from('categories').select('category_id, name').order('name')

  return (
    <EditArticleClient
      article={article as unknown as {
        article_id: number; title: string; slug: string; content: string;
        excerpt: string; status: string; featured_image: string | null;
        tags: string[] | null; category_id: number | null;
        source_reference: string | null; monetization_type: string;
      }}
      categories={(categories ?? []) as unknown as Array<{ category_id: number; name: string }>}
    />
  )
}
