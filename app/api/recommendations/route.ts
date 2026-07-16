import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRecommendations } from '@/lib/recommendations/recommender'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const userId = (userProfile as any).user_id
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 20)

    const recommendations = await getRecommendations(userId, limit)

    return NextResponse.json(
      { data: recommendations },
      { headers: { 'Cache-Control': 'private, max-age=300' } }
    )
  } catch (err) {
    console.error('[GET /api/recommendations]', err)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}
