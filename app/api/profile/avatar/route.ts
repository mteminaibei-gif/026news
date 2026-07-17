import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// PATCH /api/profile/avatar — update the authenticated user's profile_image
export async function PATCH(req: NextRequest) {
  try {
    const { profile_image } = await req.json()

    if (!profile_image || typeof profile_image !== 'string') {
      return NextResponse.json({ error: 'profile_image URL is required' }, { status: 400 })
    }

    // Only allow https URLs (reject javascript:/data: and arbitrary schemes) to
    // prevent stored resource/script injection via the avatar field.
    let parsed: URL
    try {
      parsed = new URL(profile_image)
    } catch {
      return NextResponse.json({ error: 'Invalid profile_image URL' }, { status: 400 })
    }
    if (parsed.protocol !== 'https:' || parsed.hostname.includes('..')) {
      return NextResponse.json({ error: 'profile_image must be an https URL' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await createAdminClient()
    const { error } = await admin
      .from('users')
      .update({ profile_image } as never)
      .eq('auth_id', user.id)

    if (error) {
      console.error('[Avatar] Update failed:', error.message)
      return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile_image })
  } catch (err) {
    console.error('[PATCH /api/profile/avatar]', err)
    return NextResponse.json({ error: 'Avatar update failed' }, { status: 500 })
  }
}
