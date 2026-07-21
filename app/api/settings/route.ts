import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface UserProfileExtended {
  user_id: number
  name: string | null
  bio: string | null
  profile_image: string | null
  notification_prefs: Record<string, unknown> | null
  social_links: Record<string, unknown> | null
  show_online_status: boolean | null
  updated_at: string | null
  name_change_count: number | null
  last_name_change_at: string | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single() as { data: UserProfileExtended | null }

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const prefs = (profile.notification_prefs ?? {}) as Record<string, unknown>
    const social = (profile.social_links ?? {}) as Record<string, unknown>
    const nameParts = (profile.name || '').trim().split(/\s+/)
    const website =
      (typeof social.website === 'string' && social.website) ||
      (Array.isArray(social.links) ? (social.links as string[])[0] : '') ||
      ''

    // Name change tracking info
    const nameChangeCount = profile.name_change_count ?? 0
    const lastNameChangeAt = profile.last_name_change_at ? new Date(profile.last_name_change_at) : null
    const MAX_NAME_CHANGES = 3
    const COOLDOWN_MONTHS = 3
    const cooldownEnd = lastNameChangeAt
      ? new Date(lastNameChangeAt.getTime() + COOLDOWN_MONTHS * 30 * 24 * 60 * 60 * 1000)
      : null
    const canChangeName = nameChangeCount < MAX_NAME_CHANGES || (cooldownEnd && new Date() >= cooldownEnd)

    return NextResponse.json({
      name: profile.name || '',
      bio: profile.bio || '',
      profile_image: profile.profile_image || null,
      email: user.email || '',
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      website,
      email_notifications: prefs.email_notifications !== false,
      comment_notifications: prefs.comment_notifications !== false,
      follow_notifications: prefs.follow_notifications === true,
      push_notifications: prefs.push_notifications !== false,
      weekly_digest: prefs.weekly_digest !== false,
      theme: prefs.theme || 'system',
      profile_visibility: prefs.profile_visibility !== false,
      reading_history: prefs.reading_history !== false,
      two_factor: prefs.two_factor === true,
      show_online_status: profile.show_online_status !== false,
      updated_at: profile.updated_at,
      name_change_tracking: {
        count: nameChangeCount,
        max_changes: MAX_NAME_CHANGES,
        last_changed_at: profile.last_name_change_at,
        cooldown_ends_at: cooldownEnd?.toISOString() ?? null,
        can_change: canChangeName,
      },
    })
  } catch (err) {
    console.error('[GET /api/settings]', err)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

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
      theme,
      show_online_status,
    } = body

    const { data: profile } = await (supabase as any)
      .from('users').select('user_id, name, social_links, name_change_count, last_name_change_at').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const adminDb = await createAdminClient()

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    const composedName =
      typeof name === 'string' && name.trim()
        ? name.trim()
        : `${first_name ?? ''} ${last_name ?? ''}`.trim()

    // Name change validation: max 3 changes, 3-month cooldown
    if (composedName && composedName !== (profile.name || '')) {
      const MAX_NAME_CHANGES = 3
      const COOLDOWN_MONTHS = 3

      const count = profile.name_change_count ?? 0
      const lastChange = profile.last_name_change_at ? new Date(profile.last_name_change_at) : null
      const now = new Date()
      const cooldownEnd = lastChange ? new Date(lastChange.getTime() + COOLDOWN_MONTHS * 30 * 24 * 60 * 60 * 1000) : null

      if (count >= MAX_NAME_CHANGES && cooldownEnd && now < cooldownEnd) {
        return NextResponse.json({
          error: `Name change limit reached. You can change your name again after ${cooldownEnd.toLocaleDateString()}.`,
        }, { status: 400 })
      }

      updatePayload.name = composedName.substring(0, 100)
      updatePayload.name_change_count = count + 1
      updatePayload.last_name_change_at = now.toISOString()
    }

    if (typeof bio === 'string') updatePayload.bio = bio.substring(0, 500)

    if (typeof show_online_status === 'boolean') updatePayload.show_online_status = show_online_status

    if (typeof website === 'string') {
      const social = (profile.social_links ?? {}) as Record<string, unknown>
      social.website = website
      updatePayload.social_links = social
    }

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

    const { data: updatedProfile } = await adminDb
      .from('users')
      .select('*')
      .eq('user_id', (profile as { user_id: number }).user_id)
      .single()

    if (updatedProfile) {
      const updatedPrefs = (updatedProfile.notification_prefs ?? {}) as Record<string, unknown>
      const updatedSocial = (updatedProfile.social_links ?? {}) as Record<string, unknown>
      const updatedNameParts = (updatedProfile.name || '').trim().split(/\s+/)
      const updatedWebsite =
        (typeof updatedSocial.website === 'string' && updatedSocial.website) ||
        (Array.isArray(updatedSocial.links) ? (updatedSocial.links as string[])[0] : '') ||
        ''

      return NextResponse.json({
        ok: true,
        settings: {
          name: updatedProfile.name || '',
          bio: updatedProfile.bio || '',
          profile_image: updatedProfile.profile_image || null,
          email: user.email || '',
          first_name: updatedNameParts[0] || '',
          last_name: updatedNameParts.slice(1).join(' ') || '',
          website: updatedWebsite,
          email_notifications: updatedPrefs.email_notifications !== false,
          comment_notifications: updatedPrefs.comment_notifications !== false,
          follow_notifications: updatedPrefs.follow_notifications === true,
          push_notifications: updatedPrefs.push_notifications !== false,
          weekly_digest: updatedPrefs.weekly_digest !== false,
          theme: updatedPrefs.theme || 'system',
          profile_visibility: updatedPrefs.profile_visibility !== false,
          reading_history: updatedPrefs.reading_history !== false,
          two_factor: updatedPrefs.two_factor === true,
          show_online_status: updatedProfile.show_online_status !== false,
          updated_at: updatedProfile.updated_at,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/settings]', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
