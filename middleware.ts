import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Refresh Supabase auth session (cookies) before every matched request.
  let response: NextResponse
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    response = NextResponse.next()
  } else {
    try {
      response = await updateSession(request)
    } catch (err) {
      console.error('[middleware] updateSession failed:', err)
      response = NextResponse.redirect(new URL('/login?error=session_expired', request.url))
    }
  }

  // Edge-cache GET reads (HTML pages + API) so repeated hits don't spin up a
  // Vercel function — keeps Fluid CPU/memory low on the free tier.
  // Authenticated/POST/mutating traffic is left uncached.
  const isGet = request.method === 'GET'
  const isStaticAsset = /\/_next\/|(?:\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|mp4|webm)$)/.test(
    request.nextUrl.pathname
  )
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.includes('auth-token')
  )

  if (isGet && !isStaticAsset && !hasAuthCookie) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
