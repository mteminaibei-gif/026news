import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/communities  → list communities with membership info for current user
// POST /api/communities { title, description?, is_public? } → create
export async function GET(req: NextRequest) {
  try {
    const supabase = (await createClient()) as any
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    const { data: communities, error } = await supabase
      .from('threads')
      .select('*, member_count:thread_members(count), creator:users!threads_created_by_fkey(name, profile_image)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error

    let memberSet = new Set<string>()
    if (user) {
      const { data: me } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single()
      if (me) {
        const { data: mem } = await supabase
          .from('thread_members').select('thread_id').eq('user_id', me.user_id)
        memberSet = new Set((mem ?? []).map((m: { thread_id: string }) => m.thread_id))
      }
    }

    return NextResponse.json({
      communities: (communities ?? []).map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description ?? '',
        is_public: c.is_public ?? true,
        created_at: c.created_at,
        member_count: c.member_count?.[0]?.count ?? 0,
        creator: c.creator,
        is_member: memberSet.has(c.id),
      })),
    })
  } catch (err) {
    console.error('[GET /api/communities]', err)
    return NextResponse.json({ error: 'Failed to load communities' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const title = (body.title ?? '').toString().trim()
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('threads')
      .insert({
        title: title.slice(0, 80),
        description: (body.description ?? '').toString().slice(0, 280),
        is_public: body.is_public !== false,
        created_by: user.id,
      })
      .select()
      .single()
    if (error) throw error

    // Creator joins automatically
    const { data: me } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single()
    if (me) {
      await supabase.from('thread_members').insert({ thread_id: data.id, user_id: me.user_id, role: 'owner' })
    }

    return NextResponse.json({ community: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/communities]', err)
    return NextResponse.json({ error: 'Failed to create community' }, { status: 500 })
  }
}
