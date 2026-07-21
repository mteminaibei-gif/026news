import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// POST /api/presence — heartbeat to mark user as online
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: true })

    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('auth_id', user.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

// GET /api/presence?user_ids=1,2,3 — check who is online
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const idsParam = searchParams.get('user_ids') ?? ''
    const ids = idsParam.split(',').map(Number).filter(Boolean).slice(0, 50)
    if (!ids.length) return NextResponse.json({ online: [] })

    const supabase = await createClient()
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('users')
      .select('user_id, last_active, show_online_status')
      .in('user_id', ids)

    const online = (data ?? [])
      .filter(u =>
        u.show_online_status &&
        u.last_active &&
        new Date(u.last_active) > new Date(twoMinAgo)
      )
      .map(u => u.user_id)

    return NextResponse.json({ online })
  } catch {
    return NextResponse.json({ online: [] })
  }
}
