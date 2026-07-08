import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/journalist/profile — update own profile
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('user_id, role').eq('email', user.email ?? '').single()
    const profile = rawProfile as { user_id: number; role: string } | null
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { name, bio, organization, portfolio, phone, twitter, linkedin } = await req.json()

    const updates: Record<string, unknown> = {}
    if (name?.trim()) updates.name = name.trim()
    if (bio  !== undefined) updates.bio = bio

    // Merge social_links — fetch existing first
    const { data: existing } = await supabase
      .from('users').select('social_links').eq('user_id', profile.user_id).single()
    const existingLinks = (existing as { social_links: Record<string, string> } | null)?.social_links ?? {}

    updates.social_links = {
      ...existingLinks,
      ...(organization !== undefined ? { organization } : {}),
      ...(portfolio    !== undefined ? { portfolio    } : {}),
      ...(phone        !== undefined ? { phone        } : {}),
      ...(twitter      !== undefined ? { twitter      } : {}),
      ...(linkedin     !== undefined ? { linkedin     } : {}),
    }

    const { error } = await supabase
      .from('users')
      .update(updates as never)
      .eq('user_id', profile.user_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/journalist/profile]', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
