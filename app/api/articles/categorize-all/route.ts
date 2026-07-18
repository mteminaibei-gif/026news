import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { autoCategorize } from '@/lib/auto-categorize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/articles/categorize-all — recategorize all uncategorized articles
export async function POST() {
  try {
    const adminDb = await createAdminClient()

    // Fetch all articles with NULL category_id
    const { data: articles, error: fetchError } = await adminDb
      .from('articles')
      .select('article_id, title, content, excerpt, tags, category_id')
      .is('category_id', null)
      .limit(500) as { data: Array<{ article_id: number; title: string; content: string; excerpt: string | null; tags: string[] | null; category_id: number | null }> | null; error: any }

    if (fetchError) throw fetchError
    if (!articles || articles.length === 0) {
      return NextResponse.json({ message: 'No uncategorized articles found', updated: 0 })
    }

    let updated = 0
    const updates: { article_id: number; category_id: number }[] = []

    for (const article of articles) {
      const result = autoCategorize({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        tags: article.tags,
      })

      if (result.confidence !== 'low' && result.bestCategoryId) {
        updates.push({ article_id: article.article_id, category_id: result.bestCategoryId })
      }
    }

    // Batch update
    for (const u of updates) {
      const { error } = await adminDb
        .from('articles')
        .update({ category_id: u.category_id } as never)
        .eq('article_id', u.article_id)
      if (!error) updated++
    }

    return NextResponse.json({
      message: `Recategorized ${updated} of ${articles.length} uncategorized articles`,
      updated,
      total: articles.length,
    })
  } catch (err) {
    console.error('[POST /api/articles/categorize-all]', err)
    return NextResponse.json({ error: 'Failed to recategorize' }, { status: 500 })
  }
}
