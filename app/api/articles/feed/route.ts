import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FEED_SELECT = 'article_id,title,slug,excerpt,featured_image,views,created_at,tags,source_name,is_aggregated,category_id,reading_time_minutes,like_count,share_count,author:users(user_id,name,profile_image,bio),category:categories(name)'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(Number(searchParams.get('page') ?? '1'), 1)
    const limit = Math.min(Number(searchParams.get('limit') ?? '12'), 50)
    const offset = (page - 1) * limit
    const categoryId = searchParams.get('category_id')
    const sort = searchParams.get('sort') ?? 'latest'

    const supabase = await createClient()
    let q = supabase
      .from('articles')
      .select(FEED_SELECT, { count: 'exact' })
      .eq('status', 'published')

    if (categoryId) {
      q = q.eq('category_id', Number(categoryId))
    }

    const { data, count } = await q
      .order('created_at', { ascending: sort === 'oldest' })
      .range(offset, offset + limit - 1)

    return NextResponse.json({
      articles: data ?? [],
      total: count ?? 0,
      page,
      limit,
      hasMore: (offset + limit) < (count ?? 0),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    })
  } catch (err) {
    console.error('[GET /api/articles/feed]', err)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
