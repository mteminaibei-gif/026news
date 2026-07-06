import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type UserProfile = { role: string }

// GET /api/auth/callback — handles Supabase OAuth redirect
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: rawProfile } = await supabase
        .from('users')
        .select('role')
        .eq('email', user?.email ?? '')
        .single()
      const profile = rawProfile as unknown as UserProfile | null

      if (profile?.role === 'admin')      return NextResponse.redirect(`${origin}/admin/dashboard`)
      if (profile?.role === 'journalist') return NextResponse.redirect(`${origin}/journalist/dashboard`)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
