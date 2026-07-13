import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/server-auth'
import { exchangeCodeForTokens } from '@/lib/gmail/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/gmail/callback?code=...&state=... -> exchanges code, stores tokens.
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = req.cookies.get('gmail_oauth_state')?.value

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/admin/gmail?error=invalid_state', req.url))
  }

  // Only an admin who initiated the flow may complete it.
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
  }

  try {
    await exchangeCodeForTokens(code)
  } catch (err) {
    console.error('[gmail callback]', err)
    return NextResponse.redirect(new URL('/admin/gmail?error=exchange_failed', req.url))
  }

  const res = NextResponse.redirect(new URL('/admin/gmail?connected=1', req.url))
  res.cookies.delete('gmail_oauth_state')
  return res
}
