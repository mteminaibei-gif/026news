import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/communities/[id]  { action: 'join' | 'leave' }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single()
    if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    const userId = me.user_id

    const body = await req.json().catch(() => ({}))
    const action = body.action

    if (action === 'join') {
      await supabase.from('thread_members').insert({ thread_id: id, user_id: userId, role: 'member' })
    } else if (action === 'leave') {
      await supabase.from('thread_members').delete().eq('thread_id', id).eq('user_id', userId)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, is_member: action === 'join' })
  } catch (err) {
    console.error('[POST /api/communities/[id]]', err)
    return NextResponse.json({ error: 'Failed to update membership' }, { status: 500 })
  }
}
