import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, skip auth — prevents Edge crash on cold start
  if (!supabaseUrl || !supabaseAnon) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const protectedRoutes = [
    { prefix: '/admin',      allowed: ['admin'] },
    { prefix: '/journalist', allowed: ['journalist'] },
  ]

  const route = protectedRoutes.find(r => request.nextUrl.pathname.startsWith(r.prefix))

  // Not a protected route — pass through
  if (!route) {
    return supabaseResponse
  }

  // Not logged in — redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    url.searchParams.set('error', 'login_required')
    return NextResponse.redirect(url)
  }

  // Fetch role from DB
  const { data: rawProfile, error: profileErr } = await supabase
    .from('users')
    .select('role')
    .eq('email', user.email ?? '')
    .single()

  let profile = rawProfile as { role: string } | null

  // Fallback role detection for known seed accounts if DB query fails
  if (!profile || profileErr) {
    if (user.email === 'admin@026news.com') {
      profile = { role: 'admin' }
    } else if (user.email?.startsWith('journalist')) {
      profile = { role: 'journalist' }
    }
  }

  // Wrong role — redirect to login
  if (!profile || !route.allowed.includes(profile.role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
