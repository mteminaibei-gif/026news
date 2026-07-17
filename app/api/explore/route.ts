import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('category_id')
    const page = Math.max(Number(searchParams.get('page') ?? '1'), 1)
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50)
    const offset = (page - 1) * limit

    const supabase = await createClient()

    if (categoryId) {
      const catId = Number(categoryId)
      const { data: articles, count } = await supabase
        .from('articles')
        .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)', { count: 'exact' })
        .eq('status', 'published')
        .eq('category_id', catId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      return NextResponse.json({
        articles: articles ?? [],
        total: count ?? 0,
        page,
        limit,
      })
    }

    const supabaseAdmin = await createAdminClient()
    const catResult = await supabaseAdmin
      .from('categories')
      .select('category_id, name, slug, description, icon') as unknown as {
        data: Array<{ category_id: number; name: string; slug: string; description: string | null; icon: string | null }> | null
      }
    const catRows = catResult.data

    const countResult = await supabaseAdmin
      .from('articles')
      .select('category_id')
      .eq('status', 'published') as unknown as {
        data: Array<{ category_id: number | null }> | null
      }
    const countRows = countResult.data

    if (!catRows) {
      return NextResponse.json({ categories: [], totalArticles: 0 })
    }

    const countMap: Record<number, number> = {}
    for (const row of (countRows || []) as Array<{ category_id: number | null }>) {
      if (row.category_id) countMap[row.category_id] = (countMap[row.category_id] || 0) + 1
    }

    const categories = catRows
      .filter(c => (countMap[c.category_id] || 0) > 0)
      .map(c => ({
        id: c.category_id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        articleCount: countMap[c.category_id] || 0,
      }))
      .sort((a, b) => b.articleCount - a.articleCount)

    const totalArticles = (countRows || []).length

    let featuredArticles: unknown[] = []
    if (categories.length > 0) {
      const picks: unknown[] = []
      for (const cat of categories.slice(0, 6)) {
        const { data: catArts } = await supabase
          .from('articles')
          .select('article_id,title,slug,excerpt,content,featured_image,views,created_at,tags,source_name,source_reference,is_aggregated,category_id,author:users(name,profile_image),category:categories(name)')
          .eq('status', 'published')
          .eq('category_id', cat.id)
          .order('views', { ascending: false })
          .limit(3)
        if (catArts?.length) picks.push(...catArts)
      }
      const seen = new Set<number>()
      for (const a of picks as Array<{ article_id: number }>) {
        if (!seen.has(a.article_id)) {
          seen.add(a.article_id)
          featuredArticles.push(a)
        }
        if (featuredArticles.length >= 18) break
      }
    }

    return NextResponse.json({
      categories,
      totalArticles,
      featuredArticles,
    })
  } catch (err) {
    console.error('[GET /api/explore]', err)
    return NextResponse.json({ error: 'Failed to fetch explore data' }, { status: 500 })
  }
}
