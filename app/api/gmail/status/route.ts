import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/server-auth'
import { isConnected, getConnectedEmail } from '@/lib/gmail/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/gmail/status -> { connected, email }
export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const connected = await isConnected()
  const email = connected ? await getConnectedEmail() : null
  return NextResponse.json({ connected, email })
}
