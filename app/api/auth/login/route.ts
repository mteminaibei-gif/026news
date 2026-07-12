import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type UserProfile = { role: string; name: string; profile_image: string | null; user_id: number }

// Demo accounts for preview
const DEMO_ACCOUNTS: Record<string, { password: string; user: UserProfile }> = {
  'journalist@demo.com': {
    password: 'demo123',
    user: { role: 'journalist', name: 'Demo Journalist', profile_image: null, user_id: 99901 },
  },
  'admin@demo.com': {
    password: 'demo123',
    user: { role: 'admin', name: 'Demo Admin', profile_image: null, user_id: 99902 },
  },
}

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Demo account bypass for preview
    const demoAccount = DEMO_ACCOUNTS[email]
    if (demoAccount && demoAccount.password === password) {
      return NextResponse.json({
        user: {
          id: 'demo-user-id',
          email: email,
          role: demoAccount.user.role,
          name: demoAccount.user.name,
          profile_image: demoAccount.user.profile_image,
          user_id: demoAccount.user.user_id,
          isDemo: true,
        },
      })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })

    let profile: UserProfile | null = null
    try {
      const { data: rawProfile, error: profileError } = await supabase
        .from('users')
        .select('role, name, profile_image, user_id')
        .eq('email', email)
        .single()
      if (profileError) throw profileError
      profile = rawProfile as unknown as UserProfile | null
    } catch (err) {
      console.error('Profile query failed:', err)
      return NextResponse.json(
        { error: 'User profile not found. Please ensure your account is properly set up.' },
        { status: 401 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id:            data.user.id,
        email:         data.user.email,
        role:          profile.role ?? 'reader',
        name:          profile.name ?? '',
        profile_image: profile.profile_image ?? null,
        user_id:       profile.user_id ?? null,
      },
    })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
