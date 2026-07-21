import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/messages/search?query=xxx — Search users by name for starting new conversations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single() as { data: { user_id: number } | null }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Search users by name (excluding self)
    const escaped = query.replace(/%/g, '\\%').replace(/_/g, '\\_')
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, name, profile_image, role, bio')
      .neq('user_id', profile.user_id)
      .ilike('name', `%${escaped}%`)
      .eq('status', 'active')
      .order('name')
      .limit(20)

    if (error) throw error

    return NextResponse.json({ users: users ?? [] })
  } catch (err) {
    console.error('[GET /api/messages/search]', err)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}
