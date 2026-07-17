import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'

// POST /api/auth/admin-signup
// Allows creating the FIRST admin account, or adding admins if an
// existing admin is signed in. Uses an optional secret key for
// first-time bootstrap (set ADMIN_SIGNUP_SECRET in env).
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, secret } = await req.json().catch(() => ({})) as { email?: string; password?: string; name?: string; secret?: string }

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Allow creation if:
    // (a) caller provides the correct ADMIN_SIGNUP_SECRET, OR
    // (b) a currently authenticated admin is making the request
    const adminSecret = process.env.ADMIN_SIGNUP_SECRET
    const secretMatch = adminSecret && secret === adminSecret

    if (!secretMatch) {
      const admin = await getCurrentAdmin()
      if (!admin) {
        return NextResponse.json({ error: 'Forbidden: admin secret or admin session required' }, { status: 403 })
      }
    }

    const supabase = await createClient()

    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
      : undefined

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // 1b. Auto-confirm email so admin can sign in immediately
    if (authData.user?.id) {
      const admin = await createAdminClient()
      const { error: confirmError } = await admin.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      )
      if (confirmError) console.error('[admin-signup] auto-confirm failed:', confirmError.message)

      // 2. Insert users row with role = admin (use admin client to bypass RLS)
      const { error: profileError } = await admin
        .from('users')
        .upsert({
          name: name.trim(),
          email,
          password_hash: '',
          role: 'admin',
          status: 'active',
          auth_id: authData.user.id,
        } as never, { onConflict: 'auth_id' })

      if (profileError) {
        console.error('[admin-signup] profile error:', profileError.message)
        return NextResponse.json({ error: 'Failed to create admin profile' }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Admin account created! You can now sign in.' })
  } catch (err) {
    console.error('[POST /api/auth/admin-signup]', err)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
