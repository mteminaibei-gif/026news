import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/rankings/journalists
 * Returns journalist rankings sorted by views
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch journalist rankings with author info
    const { data: rankings, error } = await supabase
      .from('journalist_rankings')
      .select(
        `
        user_id,
        total_views,
        total_earnings,
        rank_position,
        rank_tier,
        users(name, profile_image)
        `
      )
      .order('total_views', { ascending: false })
      .limit(100) as any

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count articles per journalist in memory
    const { data: articlesData } = await supabase
      .from('articles')
      .select('author_id') as any

    const articleCounts: Record<string, number> = {}
    ;(articlesData || []).forEach((row: any) => {
      if (row.author_id) {
        articleCounts[row.author_id] = (articleCounts[row.author_id] || 0) + 1
      }
    })

    // Format response
    const journalists = (rankings || []).map((rank: any) => ({
      user_id: rank.user_id,
      name: rank.users?.name || 'Anonymous',
      profile_image: rank.users?.profile_image,
      total_views: rank.total_views,
      total_earnings: rank.total_earnings,
      rank_position: rank.rank_position,
      rank_tier: rank.rank_tier,
      article_count: articleCounts[rank.user_id] || 0,
    }))

    return NextResponse.json({ journalists })
  } catch (error) {
    console.error('Rankings API error:', error)
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 })
  }
}
