import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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
