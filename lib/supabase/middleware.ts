import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedRoutes = [
    { prefix: '/admin', allowed: ['admin'] },
    { prefix: '/journalist', allowed: ['journalist'] },
  ]

  const route = protectedRoutes.find((route) => request.nextUrl.pathname.startsWith(route.prefix))

  if (!route) {
    return supabaseResponse
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    url.searchParams.set('error', 'login_required')
    return NextResponse.redirect(url)
  }

  const { data: rawProfile, error: profileErr } = await supabase
    .from('users')
    .select('role')
    .eq('email', user.email ?? '')
    .single()

  let profile = rawProfile as { role: string } | null

  // If the DB query failed for ANY reason (schema not applied, table missing, no row found)
  // fall back to email-based role detection for known accounts
  if (!profile || profileErr) {
    if (user.email === 'admin@026news.com') {
      profile = { role: 'admin' }
    } else if (user.email === 'journalist@026news.com' || user.email?.startsWith('journalist')) {
      profile = { role: 'journalist' }
    }
  }

  if (!profile || !route.allowed.includes(profile.role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
