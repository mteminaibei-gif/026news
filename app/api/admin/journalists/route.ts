import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Profile = { role: string }

// PATCH /api/admin/journalists — update journalist account status
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('role').eq('email', user.email ?? '').single()
    const profile = rawProfile as unknown as Profile | null
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, status } = await req.json()
    if (!user_id || !status) {
      return NextResponse.json({ error: 'user_id and status are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update({ status } as never)
      .eq('user_id', Number(user_id))
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/journalists]', err)
    return NextResponse.json({ error: 'Failed to update journalist' }, { status: 500 })
  }
}
