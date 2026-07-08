import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth/admin-signup
// Allows creating the FIRST admin account, or adding admins if an
// existing admin is signed in. Uses an optional secret key for
// first-time bootstrap (set ADMIN_SIGNUP_SECRET in env).
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, secret } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = await createClient()

    // Allow creation if:
    // (a) caller provides the correct ADMIN_SIGNUP_SECRET, OR
    // (b) a currently authenticated admin is making the request
    const adminSecret = process.env.ADMIN_SIGNUP_SECRET
    const secretMatch = adminSecret && secret === adminSecret

    if (!secretMatch) {
      // Check if caller is an authenticated admin
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: rawProfile } = await supabase
          .from('users').select('role').eq('email', user.email ?? '').single()
        const profile = rawProfile as { role: string } | null
        if (!profile || profile.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden: admin secret or admin session required' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: 'Forbidden: admin secret or admin session required' }, { status: 403 })
      }
    }

    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
      : undefined

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // 2. Insert users row with role = admin
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email,
        password_hash: '',
        role: 'admin',
        status: 'active',
        ...(authData.user?.id ? { auth_id: authData.user.id } : {}),
      } as never)

    if (profileError) {
      console.error('[admin-signup] profile error:', profileError.message)
    }

    return NextResponse.json({ message: 'Admin account created! Check your email to confirm, then sign in.' })
  } catch (err) {
    console.error('[POST /api/auth/admin-signup]', err)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
