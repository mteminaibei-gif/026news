import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      first_name,
      last_name,
      name,
      bio,
      website,
      email_notifications,
      comment_notifications,
      follow_notifications,
      push_notifications,
      weekly_digest,
      theme,
      profile_visibility,
      reading_history,
      two_factor,
      show_online_status,
    } = body

    // Find user by auth_id
    const { data: profile } = await supabase
      .from('users').select('user_id, name, social_links').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const adminDb = await createAdminClient()

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Compose full name from first/last; prefer explicit `name` if provided.
    const composedName =
      typeof name === 'string' && name.trim()
        ? name.trim()
        : `${first_name ?? ''} ${last_name ?? ''}`.trim()
    if (composedName) updatePayload.name = composedName.substring(0, 100)
    if (typeof bio === 'string') updatePayload.bio = bio.substring(0, 500)

    if (typeof show_online_status === 'boolean') updatePayload.show_online_status = show_online_status

    // Persist website into the existing social_links JSON column.
    if (typeof website === 'string') {
      const social = (profile.social_links ?? {}) as Record<string, unknown>
      social.website = website
      updatePayload.social_links = social
    }

    // Persist notification/appearance prefs into the notification_prefs JSON column.
    const prefs: Record<string, unknown> = {}
    const boolKeys = [
      'email_notifications', 'comment_notifications', 'follow_notifications',
      'push_notifications', 'weekly_digest', 'profile_visibility',
      'reading_history', 'two_factor',
    ] as const
    for (const k of boolKeys) {
      if (typeof body[k] === 'boolean') prefs[k] = body[k]
    }
    if (theme === 'light' || theme === 'dark' || theme === 'system') prefs.theme = theme
    if (Object.keys(prefs).length) updatePayload.notification_prefs = prefs

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
