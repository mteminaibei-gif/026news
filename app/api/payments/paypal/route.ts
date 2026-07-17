import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/server-auth'

const PAYPAL_BASE = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!
  const secret   = process.env.PAYPAL_CLIENT_SECRET!
  const creds    = Buffer.from(`${clientId}:${secret}`).toString('base64')

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`)
  const data = await res.json()
  return data.access_token as string
}

// POST /api/payments/paypal — send payout to journalist via PayPal Payouts API
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { paypal_email, amount, currency = 'USD', payout_id, note = '026connet! journalist payout' } = await req.json()
    if (!paypal_email || !amount || !payout_id) {
      return NextResponse.json({ error: 'paypal_email, amount and payout_id are required' }, { status: 400 })
    }

    const token = await getPayPalToken()

    const res = await fetch(`${PAYPAL_BASE}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: `026connet!-payout-${payout_id}-${Date.now()}`,
          email_subject:   '026connet! — Your Payout Has Been Sent',
          email_message:   note,
        },
        items: [{
          recipient_type: 'EMAIL',
          amount:         { value: Number(amount).toFixed(2), currency },
          receiver:       paypal_email,
          note,
          sender_item_id: `payout-${payout_id}`,
        }],
      }),
    })

    const data = await res.json()

    if (res.ok && data.batch_header?.payout_batch_id) {
      await supabase
        .from('payout_requests')
        .update({ status: 'processing', payment_ref: data.batch_header.payout_batch_id } as never)
        .eq('payout_id', payout_id)

      return NextResponse.json({ success: true, batch_id: data.batch_header.payout_batch_id })
    }

    return NextResponse.json({ error: data.message ?? 'PayPal payout failed', raw: data }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/payments/paypal]', err)
    return NextResponse.json({ error: 'PayPal payment failed' }, { status: 500 })
  }
}
