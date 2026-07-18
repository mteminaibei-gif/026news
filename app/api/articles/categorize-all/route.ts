import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { categorizeWithAutoCreate } from '@/lib/auto-categorize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/articles/categorize-all — recategorize all uncategorized articles.
// Articles that clearly fit a brand-new topic get a freshly-minted category.
export async function POST() {
  try {
    const adminDb = await createAdminClient()

    // Load the live taxonomy so scoring uses real category ids.
    const { data: cats } = await adminDb
      .from('categories')
      .select('category_id, name, slug') as { data: Array<{ category_id: number; name: string; slug: string }> | null; error: any }

    const taxonomy = (cats ?? []).map(c => ({
      id: c.category_id as number,
      name: c.name,
      slug: c.slug,
      keywords: [],
    }))

    // Fetch all articles with NULL category_id
    const { data: articles, error: fetchError } = await adminDb
      .from('articles')
      .select('article_id, title, content, excerpt, tags, category_id')
      .is('category_id', null)
      .limit(500) as { data: Array<{ article_id: number; title: string; content: string; excerpt: string | null; tags: string[] | null; category_id: number | null }> | null; error: any }

    if (fetchError) throw fetchError
    if (!articles || articles.length === 0) {
      return NextResponse.json({ message: 'No uncategorized articles found', updated: 0, created: 0 })
    }

    let updated = 0
    let created = 0
    const createdSlugs = new Set<string>()
    const updates: { article_id: number; category_id: number }[] = []

    for (const article of articles) {
      // createCategory mints a new category (idempotent by slug) and returns its id.
      const result = await categorizeWithAutoCreate(
        {
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          tags: article.tags,
        },
        async (name: string, slug: string) => {
          if (createdSlugs.has(slug)) return null
          if (cats?.some(c => c.slug === slug)) return null
          const { data: inserted, error: insErr } = await adminDb
            .from('categories')
            .insert({ name, slug, description: 'Auto-generated from article coverage' } as never)
            .select('category_id')
            .single() as { data: { category_id: number } | null; error: any }
          if (!insErr && inserted) {
            createdSlugs.add(slug)
            created++
            return inserted.category_id
          }
          return null
        },
        { taxonomy: taxonomy.length ? taxonomy : undefined, allowAutoCreate: true }
      )

      if (result.confidence !== 'low' && typeof result.bestCategoryId === 'number') {
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
      message: `Recategorized ${updated} of ${articles.length} articles${created ? `, created ${created} new categor${created === 1 ? 'y' : 'ies'}` : ''}`,
      updated,
      created,
      total: articles.length,
    })
  } catch (err) {
    console.error('[POST /api/articles/categorize-all]', err)
    return NextResponse.json({ error: 'Failed to recategorize' }, { status: 500 })
  }
}
