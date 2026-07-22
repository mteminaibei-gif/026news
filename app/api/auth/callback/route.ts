import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * Single callback for Supabase auth flows:
 *  - OAuth (Google etc.) → `?code=...`
 *  - Email confirmation → `?token_hash=...&type=signup`
 *
 * After exchanging/verifying, we redirect. Email signups are sent to the
 * verify-email page (which shows the success state and then routes the user
 * to their profile); everything else goes to `next` (default home).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const email = url.searchParams.get('email')
  const next = url.searchParams.get('next') ?? '/'
  const origin = url.origin

  // Only allow same-origin, app-relative paths. Reject protocol-relative (`//`),
  // absolute URLs, and internal API routes.
  const isSafeNext =
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.toLowerCase().startsWith('/api') &&
    !next.includes('://')
  const safeNext = isSafeNext ? next : '/'

  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  try {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
      response = NextResponse.redirect(`${origin}${safeNext}`)
    } else if (token_hash && type) {
      // Build the redirect URL FIRST so the supabase client's setAll
      // writes cookies onto the actual response returned to the browser.
      const target = new URL('/verify-email', origin)
      target.searchParams.set('verified', '1')
      if (email) target.searchParams.set('email', email)
      response = NextResponse.redirect(target.toString())

      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as never,
        ...(email ? { email } : {}),
      } as never)

      if (error) {
        response = NextResponse.redirect(`${origin}/login?error=verification_failed`)
      }
    } else {
      response = NextResponse.redirect(`${origin}${safeNext}`)
    }
  } catch {
    response = NextResponse.redirect(`${origin}/login?error=verification_failed`)
  }

  return response
}
