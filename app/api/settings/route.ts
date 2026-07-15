import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, bio, notification_prefs } = body

    // Find user by auth_id
    const { data: profile } = await supabase
      .from('users').select('user_id').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const adminDb = await createAdminClient()

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (typeof name === 'string') updatePayload.name = name.substring(0, 100)
    if (typeof bio === 'string') updatePayload.bio = bio.substring(0, 500)
    if (notification_prefs && typeof notification_prefs === 'object') {
      updatePayload.notification_prefs = notification_prefs
    }

    const { error } = await adminDb
      .from('users')
      .update(updatePayload as never)
      .eq('user_id', (profile as { user_id: number }).user_id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/settings]', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
