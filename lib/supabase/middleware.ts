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

  const pathname = request.nextUrl.pathname

  // Auth pages should not be reachable once signed in. Send the user to their
  // role-appropriate home so they can't "sign in again" until they sign out.
  const authPages = ['/login', '/signup']
  if (user && authPages.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    let home = '/profile'
    if (user) {
      try {
        const { data: rawProfile } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single()
        const role = (rawProfile as { role?: string } | null)?.role
        if (role === 'admin') home = '/admin'
        else if (role === 'journalist') home = '/journalist'
      } catch {
        /* fall back to /profile */
      }
    }
    const url = request.nextUrl.clone()
    url.pathname = home
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Routes that require a logged-in user (any role). These were previously
  // only guarded client-side, allowing unauthenticated flashes / SSR data
  // exposure. Edge protection closes that gap.
  const ALL_ROLES = ['admin', 'journalist', 'reader']

  const protectedRoutes = [
    { prefix: '/admin',          allowed: ['admin'] },
    { prefix: '/journalist',     allowed: ['journalist'] },
    { prefix: '/inbox',          allowed: ALL_ROLES },
    { prefix: '/profile',        allowed: ALL_ROLES },
    { prefix: '/settings',       allowed: ALL_ROLES },
    { prefix: '/notifications',  allowed: ALL_ROLES },
    { prefix: '/mpesa-withdrawal', allowed: ALL_ROLES },
    { prefix: '/onboarding',     allowed: ALL_ROLES },
    { prefix: '/moderation',     allowed: ['admin', 'journalist'] },
  ]

  const route = protectedRoutes.find(
    r => pathname === r.prefix || pathname.startsWith(r.prefix + '/')
  )

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
    .eq('auth_id', user.id)
    .single()

  const profile = rawProfile as { role: string } | null

  // If DB query fails or profile not found, allow through — the user may
  // be completing onboarding. The login API handles missing profiles.
  if (!profile || profileErr) {
    return supabaseResponse
  }

  // Wrong role — redirect to login
  if (!route.allowed.includes(profile.role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
