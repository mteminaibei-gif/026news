/**
 * Supabase Edge Function: process-payouts
 *
 * Triggered: Monthly (via Supabase scheduler)
 * Purpose: Calculate 50/50 revenue split between platform and journalists
 * Create payout records based on article views
 *
 * Deploy:  supabase functions deploy process-payouts
 * Schedule: First day of each month at 00:00 UTC: "0 0 1 * *"
 *
 * Invoke manually:
 *   curl -X POST https://<project>.supabase.co/functions/v1/process-payouts \
 *     -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Revenue split: 50% to journalists, 50% to platform
const JOURNALIST_SHARE = 0.5
const PLATFORM_SHARE = 0.5

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    console.log('Starting monthly payout process...')

    // 1. Get total AdSense revenue for the month (placeholder — integrate with AdSense API)
    // For now, we'll assume this is passed as env var or calculated
    const totalMonthlyRevenue = Number(Deno.env.get('MONTHLY_ADSENSE_REVENUE') || '10000')

    if (totalMonthlyRevenue === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No revenue to distribute' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const journalistPool = totalMonthlyRevenue * JOURNALIST_SHARE
    const platformPool = totalMonthlyRevenue * PLATFORM_SHARE

    console.log(
      `Monthly Revenue: $${totalMonthlyRevenue} | Journalist Pool: $${journalistPool.toFixed(2)} | Platform: $${platformPool.toFixed(2)}`
    )

    // 2. Calculate total views across all published articles this month
    const thisMonth = new Date()
    const firstDay = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
    const lastDay = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0)

    const { data: articlesThisMonth } = await supabase
      .from('articles')
      .select('article_id, author_id, views')
      .eq('status', 'published')
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString())

    if (!articlesThisMonth || articlesThisMonth.length === 0) {
      console.log('No articles this month')
      return new Response(
        JSON.stringify({ success: true, message: 'No articles this month', payoutsCreated: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Calculate total views
    const totalViews = (articlesThisMonth || []).reduce((sum, a: any) => sum + (a.views || 0), 0)

    if (totalViews === 0) {
      console.log('No views this month')
      return new Response(
        JSON.stringify({ success: true, message: 'No views this month', payoutsCreated: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 4. Group views by author and calculate payouts
    const authorViews: Record<string, number> = {}
    ;(articlesThisMonth || []).forEach((article: any) => {
      if (article.author_id) {
        authorViews[article.author_id] = (authorViews[article.author_id] || 0) + (article.views || 0)
      }
    })

    // 5. Create payout records
    const payouts = []
    for (const [authorId, views] of Object.entries(authorViews)) {
      const viewPercentage = views / totalViews
      const payoutAmount = journalistPool * viewPercentage

      const { error: payoutErr } = await supabase.from('payout_records').insert({
        user_id: Number(authorId),
        payout_amount: Math.round(payoutAmount * 100) / 100, // Round to 2 decimals
        payout_method: 'pending', // User selects method
        status: 'pending',
        requested_at: new Date().toISOString(),
      })

      if (!payoutErr) {
        payouts.push({
          user_id: authorId,
          views,
          viewPercentage: (viewPercentage * 100).toFixed(2),
          amount: payoutAmount.toFixed(2),
        })
      } else {
        console.error(`Payout error for user ${authorId}:`, payoutErr)
      }
    }

    console.log(`Created ${payouts.length} payout records`)

    return new Response(
      JSON.stringify({
        success: true,
        totalRevenue: totalMonthlyRevenue,
        journalistPool: journalistPool.toFixed(2),
        platformPool: platformPool.toFixed(2),
        payoutsCreated: payouts.length,
        payouts,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Payout processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

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
        // await mpesaB2C({ phoneNumber, amount, remarks: '026connet! payout' })
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
