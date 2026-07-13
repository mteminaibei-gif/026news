import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getCurrentAdmin } from '@/lib/server-auth'
import { buildConsentUrl } from '@/lib/gmail/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/gmail/auth -> starts the Google OAuth consent flow for the inbox.
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
  }

  if (!process.env.GMAIL_CLIENT_ID) {
    return NextResponse.redirect(new URL('/admin/gmail?error=missing_client_id', req.url))
  }

  const state = randomBytes(16).toString('hex')
  const res = NextResponse.redirect(buildConsentUrl(state))
  res.cookies.set('gmail_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
