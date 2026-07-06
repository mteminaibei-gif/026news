import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth/signup
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, bio = '', organization = '', portfolio = '', phone = '' } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabase = await createClient()

    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
      : undefined

    // 1. Create Supabase Auth user
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // 2. Insert profile row — force journalist role and persist extra fields.
    // Note: users table currently supports `bio` and `profile_image`. We'll embed organization/portfolio/phone into bio for now.
    const combinedBio = `${bio}\n\nOrganization: ${organization || '-'}\nPortfolio: ${portfolio || '-'}\nPhone: ${phone || '-'}`
    const profilePayload = {
      name:          name?.trim() || email.split('@')[0],
      email,
      password_hash: '',
      role:          'journalist',
      bio:           combinedBio,
      status:        'active',
    }
    const { error: profileError } = await supabase
      .from('users')
      .insert(profilePayload as never)

    if (profileError) {
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
