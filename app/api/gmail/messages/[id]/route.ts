import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/server-auth'
import { getMessage } from '@/lib/gmail/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/gmail/messages/[id] -> full message (decoded body + headers)
export async function GET(_req: Request, ctx: Ctx) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const { id } = await ctx.params
  try {
    const message = await getMessage(id)
    return NextResponse.json(message)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed'
    if (message === 'NOT_CONNECTED') {
      return NextResponse.json({ error: 'not_connected' }, { status: 409 })
    }
    console.error('[gmail message]', err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
