import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/payments/mpesa/callback — called by Safaricom after STK Push completes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const stk  = body?.Body?.stkCallback

    if (!stk) return NextResponse.json({ ok: true }) // ignore malformed

    const checkoutId = stk.CheckoutRequestID as string
    const resultCode = Number(stk.ResultCode)

    // Use service role to update regardless of RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    if (resultCode === 0) {
      // Success — mark payout paid
      await supabase
        .from('payout_requests')
        .update({ status: 'paid', paid_at: new Date().toISOString() } as never)
        .eq('payment_ref', checkoutId)
    } else {
      // Failed — revert to pending so admin can retry
      await supabase
        .from('payout_requests')
        .update({ status: 'failed' } as never)
        .eq('payment_ref', checkoutId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mpesa/callback]', err)
    return NextResponse.json({ ok: false })
  }
}
