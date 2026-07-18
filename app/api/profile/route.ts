import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/profile/ensure — guarantee a users row exists for the
// logged-in auth user. The handle_new_user trigger normally creates
// it on signup, but if that didn't run (or the row is missing for
// any reason) we create it here server-side using the admin client
// so the profile page never breaks for a valid session.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>
    const name =
      (typeof meta.name === 'string' && meta.name.trim()) ||
      (user.email ? user.email.split('@')[0] : '') ||
      'Reader'
    const role = (typeof meta.role === 'string' ? meta.role : 'reader') as string
    const email = (user.email || '').toLowerCase()

    const adminDb = await createAdminClient()
    const { data, error } = await adminDb
      .from('users')
      .upsert(
        { auth_id: user.id, name, email, role, status: 'active', password_hash: '' } as never,
        { onConflict: 'auth_id' },
      )
      .select('user_id, name, role, email, profile_image, bio, created_at')
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ profile: data })
  } catch (err) {
    console.error('[POST /api/profile/ensure]', err)
    return NextResponse.json({ error: 'Failed to ensure profile' }, { status: 500 })
  }
}

// PATCH /api/profile — update reader's own profile
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('user_id').eq('auth_id', user.id).single()
    const profile = rawProfile as { user_id: number } | null
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { name, bio } = await req.json()

    const updates: Record<string, unknown> = {}
    if (name?.trim()) updates.name = name.trim()
    if (bio !== undefined) updates.bio = bio || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const adminDb = await createAdminClient()
    const { error } = await adminDb
      .from('users')
      .update(updates as never)
      .eq('user_id', profile.user_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/profile]', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
