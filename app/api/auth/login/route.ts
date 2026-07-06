import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type UserProfile = { role: string; name: string; profile_image: string | null; user_id: number }

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users')
      .select('role, name, profile_image, user_id')
      .eq('email', email)
      .single()
    const profile = rawProfile as unknown as UserProfile | null

    return NextResponse.json({
      user: {
        id:            data.user.id,
        email:         data.user.email,
        role:          profile?.role ?? 'reader',
        name:          profile?.name ?? '',
        profile_image: profile?.profile_image ?? null,
        user_id:       profile?.user_id ?? null,
      },
    })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
