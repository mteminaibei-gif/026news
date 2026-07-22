import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SINGLE_SELECT = 'article_id,title,slug,excerpt,content,featured_image,views,created_at,tags,source_name,source_reference,is_aggregated,category_id,reading_time_minutes,like_count,share_count,author:users(user_id,name,profile_image,bio),category:categories(name)'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')

    if (!id && !slug) {
      return NextResponse.json({ error: 'Provide ?id= or ?slug=' }, { status: 400 })
    }

    const supabase = await createClient()
    let q = supabase.from('articles').select(SINGLE_SELECT).eq('status', 'published')

    if (id) q = q.eq('article_id', Number(id))
    else q = q.eq('slug', slug!)

    const { data, error } = await q.single()
    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    console.error('[GET /api/articles/single]', err)
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 })
  }
}
