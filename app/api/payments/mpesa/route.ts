import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MPESA_BASE = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke'

// ── M-Pesa Daraja STK Push helper ────────────────────────────
async function getMpesaToken(): Promise<string> {
  const key    = process.env.MPESA_CONSUMER_KEY!
  const secret = process.env.MPESA_CONSUMER_SECRET!
  const creds  = Buffer.from(`${key}:${secret}`).toString('base64')

  const res = await fetch(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
  })
  if (!res.ok) throw new Error(`M-Pesa auth failed: ${res.status}`)
  const data = await res.json()
  return data.access_token as string
}

function mpesaTimestamp(): string {
  return new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)
}

function mpesaPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

// POST /api/payments/mpesa — initiate STK Push payout to journalist
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('role, user_id').eq('auth_id', user.id).single()
    const profile = rawProfile as { role: string; user_id: number } | null
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const { phone, amount, payout_id } = await req.json().catch(() => ({})) as { phone?: string; amount?: number; payout_id?: number }
    if (!phone || !amount || !payout_id) {
      return NextResponse.json({ error: 'phone, amount and payout_id are required' }, { status: 400 })
    }

    const shortcode = process.env.MPESA_SHORTCODE!
    const passkey   = process.env.MPESA_PASSKEY!
    const timestamp = mpesaTimestamp()
    const password  = mpesaPassword(shortcode, passkey, timestamp)
    const token     = await getMpesaToken()

    // Normalize phone: strip leading 0 / + and ensure 254 prefix
    const normalizedPhone = String(phone).replace(/^\+/, '').replace(/^0/, '254')

    const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password:          password,
        Timestamp:         timestamp,
        TransactionType:   'CustomerPayBillOnline',
        Amount:            Math.ceil(Number(amount)), // M-Pesa requires whole KES amounts
        PartyA:            normalizedPhone,
        PartyB:            shortcode,
        PhoneNumber:       normalizedPhone,
        CallBackURL:       `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/callback`,
        AccountReference:  '026News Payout',
        TransactionDesc:   `Journalist payout #${payout_id}`,
      }),
    })

    const stkData = await stkRes.json()

    if (stkData.ResponseCode === '0') {
      // Mark payout as processing
      await supabase
        .from('payout_requests')
        .update({ status: 'processing', payment_ref: stkData.CheckoutRequestID } as never)
        .eq('payout_id', payout_id)

      return NextResponse.json({ success: true, checkout_request_id: stkData.CheckoutRequestID })
    }

    return NextResponse.json({ error: stkData.errorMessage ?? 'STK Push failed', raw: stkData }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/payments/mpesa]', err)
    return NextResponse.json({ error: 'M-Pesa payment failed' }, { status: 500 })
  }
}
