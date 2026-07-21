import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/users/search?q=term -> users matching name/bio (+ following status)
export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('users')
      .select('user_id, name, profile_image, role, bio')
      .order('name')
      .limit(30)

    if (q) {
      const escaped = q.replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.or(`name.ilike.%${escaped}%,bio.ilike.%${escaped}%`)
    }

    const { data, error } = await query
    if (error) throw error

    let followingIds: number[] = []
    if (user) {
      const { data: me } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single()
      if (me) {
        const { data: f } = await supabase
          .from('user_follows').select('following_id').eq('follower_id', me.user_id)
        followingIds = (f ?? []).map((x: { following_id: number }) => x.following_id)
      }
    }

    const results = (data ?? []).map((u: any) => ({
      ...u,
      is_following: followingIds.includes(u.user_id),
    }))

    return NextResponse.json({ users: results })
  } catch (err) {
    console.error('[GET /api/users/search]', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
