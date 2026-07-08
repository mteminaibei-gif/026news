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
      console.warn('Login profile query failed, using email-based role fallback:', err)
      if (email === 'admin@026news.com') {
        profile = { role: 'admin', name: 'Admin User', profile_image: null, user_id: 2 }
      } else if (email === 'journalist@026news.com' || email.includes('journalist')) {
        profile = { role: 'journalist', name: 'Journalist User', profile_image: null, user_id: 3 }
      }
    }

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
