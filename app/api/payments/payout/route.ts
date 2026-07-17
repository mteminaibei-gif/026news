import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/server-auth'

/**
 * POST /api/payments/payout
 *
 * Trigger manual payout for journalist
 * Request body:
 * {
 *   paymentMethod: 'mpesa' | 'paypal',
 *   amount: number,
 *   phoneNumber?: string (for M-Pesa),
 *   email?: string (for PayPal)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (currentUser.role !== 'journalist') {
      return NextResponse.json({ error: 'Only journalists can request payouts' }, { status: 403 })
    }

    const { paymentMethod, amount, phoneNumber, email } = await req.json().catch(() => ({})) as { paymentMethod?: string; amount?: number; phoneNumber?: string; email?: string }

    if (!paymentMethod || !['mpesa', 'paypal'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Create payout record
    const { data: payout, error: payoutErr } = await supabase
      .from('payout_records')
      .insert({
        user_id: currentUser.userId,
        payout_amount: amount,
        payout_method: paymentMethod,
        phone_number: phoneNumber || null,
        email_address: email || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
      } as any)
      .select()
      .single()

    if (payoutErr) {
      return NextResponse.json({ error: payoutErr.message }, { status: 400 })
    }

    // TODO: Integrate with actual M-Pesa or PayPal API
    // For now, just return the payout record

    return NextResponse.json({
      message: 'Payout request created',
      payout,
    })
  } catch (error) {
    console.error('Payout error:', error)
    return NextResponse.json({ error: 'Payout failed' }, { status: 500 })
  }
}
