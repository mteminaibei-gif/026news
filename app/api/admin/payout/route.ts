import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Profile    = { user_id: number; role: string }
type EarnRow    = { user_id: number; amount: number }
type JournRow   = { user_id: number; name: string; email: string; social_links: Record<string, string> | null }

// POST /api/admin/payout
// Calculates 50/50 revenue split for a given period and creates
// payout_requests rows. Optionally triggers M-Pesa or PayPal if
// payment_method is provided.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users').select('user_id, role').eq('email', user.email ?? '').single()
    const profile = rawProfile as unknown as Profile | null
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const { period_start, period_end, payment_method = 'manual', trigger_payment = false } = await req.json()

    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'period_start and period_end are required (YYYY-MM-DD)' }, { status: 400 })
    }

    // 1. Sum earnings per journalist for the period (only pending earnings)
    const { data: rawEarnings } = await supabase
      .from('earnings')
      .select('user_id, amount')
      .eq('payout_status', 'pending' as never)
      .gte('created_at', `${period_start}T00:00:00`)
      .lte('created_at', `${period_end}T23:59:59`)
    const earningsRows = (rawEarnings ?? []) as unknown as EarnRow[]

    // Aggregate by journalist
    const byJournalist = new Map<number, number>()
    for (const row of earningsRows) {
      byJournalist.set(row.user_id, (byJournalist.get(row.user_id) ?? 0) + Number(row.amount))
    }

    if (byJournalist.size === 0) {
      return NextResponse.json({ message: 'No pending earnings found for this period.', payouts_created: 0 })
    }

    // 2. Fetch journalist profiles for payment details
    const journalistIds = [...byJournalist.keys()]
    const { data: rawJournalists } = await supabase
      .from('users')
      .select('user_id, name, email, social_links')
      .in('user_id', journalistIds)
    const journalists = (rawJournalists ?? []) as unknown as JournRow[]

    const created: number[] = []
    const skipped: string[] = []

    for (const journalist of journalists) {
      const totalAmount     = byJournalist.get(journalist.user_id) ?? 0
      if (totalAmount < 1) { skipped.push(journalist.name); continue }

      const journalist_cut = totalAmount * 0.5  // 50% to journalist
      const platform_fee   = totalAmount * 0.5  // 50% retained

      // Insert payout request
      const { data: payoutRow, error: payoutErr } = await supabase
        .from('payout_requests')
        .insert({
          user_id:        journalist.user_id,
          amount:         totalAmount,
          platform_fee,
          journalist_cut,
          payment_method,
          status:         'pending',
          period_start,
          period_end,
          initiated_by:   profile.user_id,
        } as never)
        .select('payout_id')
        .single()

      if (payoutErr) { console.error('[payout] insert error', payoutErr.message); continue }
      const payoutId = (payoutRow as { payout_id: number }).payout_id
      created.push(payoutId)

      // Mark earnings as paid for this journalist + period
      await supabase
        .from('earnings')
        .update({ payout_status: 'paid' } as never)
        .eq('user_id', journalist.user_id)
        .eq('payout_status', 'pending' as never)
        .gte('created_at', `${period_start}T00:00:00`)
        .lte('created_at', `${period_end}T23:59:59`)

      // Optionally trigger payment gateway
      if (trigger_payment && payment_method !== 'manual') {
        const phone       = journalist.social_links?.phone
        const paypalEmail = journalist.social_links?.portfolio ?? journalist.email

        try {
          if (payment_method === 'mpesa' && phone) {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
              body: JSON.stringify({ phone, amount: journalist_cut, payout_id: payoutId }),
            })
          } else if (payment_method === 'paypal') {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paypal`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
              body: JSON.stringify({ paypal_email: paypalEmail, amount: journalist_cut, payout_id: payoutId }),
            })
          }
        } catch (e) {
          console.error('[payout] payment trigger error', e)
        }
      }
    }

    const totalPaid = created.length > 0
      ? journalists
          .filter(j => created.length > 0)
          .reduce((s, j) => s + ((byJournalist.get(j.user_id) ?? 0) * 0.5), 0)
      : 0

    return NextResponse.json({
      success:          true,
      payouts_created:  created.length,
      payout_ids:       created,
      skipped:          skipped.length,
      journalist_total: totalPaid,
      platform_total:   totalPaid,
      period_start,
      period_end,
      payment_method,
    })
  } catch (err) {
    console.error('[POST /api/admin/payout]', err)
    return NextResponse.json({ error: 'Payout calculation failed' }, { status: 500 })
  }
}

// GET /api/admin/payout — list recent payouts
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: rawP } = await supabase.from('users').select('role').eq('email', user.email ?? '').single()
    if ((rawP as { role: string } | null)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data } = await supabase
      .from('payout_requests')
      .select('*, journalist:users(name, email)')
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[GET /api/admin/payout]', err)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}
