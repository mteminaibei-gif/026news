import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// PATCH /api/admin/profile — update admin's own profile
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is actually an admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()
    if (!profile || (profile as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, bio } = body

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = String(name).trim()
    if (bio !== undefined) updates.bio = String(bio).trim() || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { error } = await admin
      .from('users')
      .update(updates as never)
      .eq('auth_id', user.id)

    if (error) {
      console.error('[Admin Profile] Update failed:', error.message)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/profile]', err)
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 })
  }
}
