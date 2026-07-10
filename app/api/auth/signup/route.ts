import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth/signup
export async function POST(req: NextRequest) {
  try {
    const {
      email,
      password,
      name,
      role          = 'reader',
      bio           = '',
      organization  = '',
      portfolio     = '',
      phone         = '',
    } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (!['journalist', 'reader', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = await createClient()

    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
      : undefined

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // 2. Insert profile row — store extra journalist fields in social_links JSONB
    //    rather than embedding them in the bio string.
    const profilePayload = {
      name:          name?.trim() || email.split('@')[0],
      email,
      password_hash: '',
      role:          role,
      bio:           bio.trim() || null,
      status:        'active',
      // Store structured fields in social_links (already a JSONB column in schema)
      social_links: role === 'journalist' ? {
        organization: organization.trim() || null,
        portfolio:    portfolio.trim()    || null,
        phone:        phone.trim()        || null,
      } : null,
      // Link auth.uid() so RLS policies work
      ...(authData.user?.id ? { auth_id: authData.user.id } : {}),
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert(profilePayload as never)

    if (profileError) {
      // Log but don't fail the signup — user can complete profile later
      console.error('[signup] profile insert error:', profileError.message)
    }

    return NextResponse.json({
      message: 'Account created! Check your email to confirm before signing in.',
    })
  } catch (err) {
    console.error('[POST /api/auth/signup]', err)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}