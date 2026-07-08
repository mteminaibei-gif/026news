import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  // Guard: if Supabase env vars are missing, skip auth and continue normally
  // This prevents MIDDLEWARE_INVOCATION_FAILED on Vercel when env vars are not yet set
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn('[proxy] Supabase env vars missing — skipping auth session update')
    return NextResponse.next()
  }

  try {
    return await updateSession(request)
  } catch (err) {
    // If middleware crashes for any reason, fail open (let the request through)
    // so the site remains accessible rather than showing a 500
    console.error('[proxy] updateSession failed:', err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
