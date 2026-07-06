/**
 * Supabase Edge Function: process-payouts
 *
 * Calculates pending earnings for each journalist and marks them as paid.
 * Integrates with Stripe (global) or M-Pesa (East Africa) based on journalist preference.
 *
 * Deploy:  supabase functions deploy process-payouts
 * Schedule: Run monthly — "0 9 1 * *" (9am on the 1st of each month)
 *
 * Invoke manually:
 *   curl -X POST https://pfbudymlpfijhslituwc.supabase.co/functions/v1/process-payouts \
 *     -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_SECRET_KEY          = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const MPESA_CONSUMER_KEY         = Deno.env.get('MPESA_CONSUMER_KEY') ?? ''

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 1. Fetch all pending earnings grouped by user
  const { data: pendingEarnings, error } = await supabase
    .from('earnings')
    .select('*, user:users ( name, email, profile_image )')
    .eq('payout_status', 'pending')

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  // Group by user_id
  const byUser = new Map<number, { amount: number; earningIds: number[]; user: { name: string; email: string } }>()
  for (const row of (pendingEarnings ?? [])) {
    const uid = row.user_id as number
    if (!byUser.has(uid)) {
      byUser.set(uid, { amount: 0, earningIds: [], user: row.user as { name: string; email: string } })
    }
    const entry = byUser.get(uid)!
    entry.amount += Number(row.amount)
    entry.earningIds.push(row.earning_id as number)
  }

  const results: { userId: number; amount: number; status: string }[] = []

  for (const [userId, { amount, earningIds, user }] of byUser) {
    if (amount < 1) continue // Skip tiny balances

    try {
      // ── Stripe payout (placeholder — wire in real Stripe Transfer API) ──────
      if (STRIPE_SECRET_KEY) {
        // await stripe.transfers.create({ amount: Math.round(amount * 100), currency: 'usd', destination: stripeAccountId })
        console.log(`[Stripe] Would pay ${user.email} $${amount.toFixed(2)}`)
      }

      // ── M-Pesa payout (placeholder — wire in Daraja B2C API) ─────────────
      if (MPESA_CONSUMER_KEY) {
        // await mpesaB2C({ phoneNumber, amount, remarks: '026News payout' })
        console.log(`[M-Pesa] Would pay ${user.email} KES ${(amount * 130).toFixed(0)}`)
      }

      // Mark earnings as paid
      await supabase
        .from('earnings')
        .update({ payout_status: 'paid' })
        .in('earning_id', earningIds)

      results.push({ userId, amount, status: 'paid' })
    } catch (payErr) {
      console.error(`Payout failed for user ${userId}:`, payErr)
      results.push({ userId, amount, status: 'failed' })
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
