import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/server-auth'
import { listMessages } from '@/lib/gmail/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/gmail/messages?max=20 -> inbox list (metadata)
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const max = Math.min(Number(req.nextUrl.searchParams.get('max') ?? '20') || 20, 50)
  try {
    const data = await listMessages(max)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed'
    if (message === 'NOT_CONNECTED') {
      return NextResponse.json({ error: 'not_connected' }, { status: 409 })
    }
    console.error('[gmail messages]', err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
