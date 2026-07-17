import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/payments/mpesa/callback — called by Safaricom after STK Push completes
//
// SECURITY:
//  - Safaricom Daraja does not sign callbacks with HMAC by default, so we cannot
//    cryptographically verify the caller. We mitigate spoofing by:
//    1. Requiring the CheckoutRequestID to match a payout that is currently in
//       `processing` state (spraying random IDs hits nothing).
//    2. Only transitioning processing -> paid/failed (terminal-state guard,
//       so replays cannot flip an already-paid payout back to failed, nor
//       re-mark a failed one as paid).
//    3. Optional shared-secret header (MPESA_CALLBACK_SECRET) if configured —
//       a hook for a reverse proxy / future Safaricom enhancement.
export async function POST(req: NextRequest) {
  try {
    // Optional defense-in-depth: reject if a shared secret is configured and missing/wrong
    const callbackSecret = process.env.MPESA_CALLBACK_SECRET
    if (callbackSecret) {
      const provided = req.headers.get('x-mpesa-secret')
      if (provided !== callbackSecret) {
        console.error('[mpesa/callback] rejected: missing/invalid callback secret')
        return NextResponse.json({ ok: false }, { status: 401 })
      }
    }

    const body = await req.json()
    const stk = body?.Body?.stkCallback

    if (!stk) return NextResponse.json({ ok: true }) // ignore malformed

    const checkoutId = stk.CheckoutRequestID as string
    const resultCode = Number(stk.ResultCode)

    if (!checkoutId) return NextResponse.json({ ok: true })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Fetch the payout FIRST to verify it exists and is in `processing` state.
    // This is the core anti-spoofing guard: random/guessed CheckoutRequestIDs
    // will not match any processing payout and are ignored.
    const { data: payout, error: fetchErr } = await supabase
      .from('payout_requests')
      .select('payout_id, status, payment_ref')
      .eq('payment_ref', checkoutId)
      .single()

    if (fetchErr || !payout) {
      // No matching payout — ignore (could be a stray/replay/spoofed callback)
      console.warn('[mpesa/callback] no processing payout for CheckoutRequestID:', checkoutId)
      return NextResponse.json({ ok: true })
    }

    // Terminal-state guard: only act on payouts still in `processing`.
    if (payout.status !== 'processing') {
      // Already resolved (paid/failed) — idempotent no-op.
      return NextResponse.json({ ok: true })
    }

    if (resultCode === 0) {
      await supabase
        .from('payout_requests')
        .update({ status: 'paid', paid_at: new Date().toISOString() } as never)
        .eq('payout_id', payout.payout_id)
    } else {
      await supabase
        .from('payout_requests')
        .update({ status: 'failed' } as never)
        .eq('payout_id', payout.payout_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mpesa/callback]', err)
    return NextResponse.json({ ok: false })
  }
}
