import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/server-auth'
import { sendEmail } from '@/lib/gmail/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/gmail/send { to, subject, html, threadId?, inReplyTo?, references? }
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  const ct = req.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const to = String(body.to ?? '').trim()
  const subject = String(body.subject ?? '').trim()
  const html = String(body.html ?? '').trim()

  if (!to || !subject || !html) {
    return NextResponse.json({ error: 'to, subject and html are required' }, { status: 400 })
  }

  try {
    const result = await sendEmail({
      to,
      subject,
      html,
      threadId: body.threadId ? String(body.threadId) : undefined,
      inReplyTo: body.inReplyTo ? String(body.inReplyTo) : undefined,
      references: body.references ? String(body.references) : undefined,
    })
    return NextResponse.json({ ok: true, id: result.id, threadId: result.threadId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed'
    if (message === 'NOT_CONNECTED') {
      return NextResponse.json({ error: 'not_connected' }, { status: 409 })
    }
    console.error('[gmail send]', err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
