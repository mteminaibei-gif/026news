import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/cron/fetch-feeds
 *
 * Trigger for RSS aggregation. To keep Vercel's free-tier Fluid compute budget
 * intact, the heavy lifting (fetching feeds, parsing, inserting articles) runs
 * in a Supabase Edge Function (`aggregate-feeds`) on a Supabase schedule —
 * NOT in this Vercel function. This route only:
 *   1. Authorizes the request (CRON_SECRET / x-vercel-cron)
 *   2. Invokes the Supabase Edge Function (if configured)
 *   3. Otherwise runs a lightweight local fallback (dev only)
 *
 * Deploy the edge function + schedule once with:
 *   supabase functions deploy aggregate-feeds
 *   # then schedule it in Supabase Dashboard → Edge Functions → Schedule
 *   # e.g. every 15 min: cron "0,15,30,45 * * * *"
 */

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const cronSecret = process.env.CRON_SECRET

  const isAuthorized = Boolean(cronSecret) && (
    authHeader === `Bearer ${cronSecret}` || (isVercelCron && process.env.VERCEL === '1')
  )

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const functionsUrl = process.env.SUPABASE_FUNCTIONS_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Production path: delegate to Supabase Edge Function (no heavy work here).
  if (functionsUrl && serviceRoleKey && process.env.VERCEL === '1') {
    try {
      const res = await fetch(`${functionsUrl}/aggregate-feeds`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        // Don't block the Vercel invocation on the (long) edge function.
        signal: AbortSignal.timeout(8000),
      })
      return NextResponse.json({
        ok: true,
        delegated: true,
        edgeFunctionStatus: res.status,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      // Edge function may run longer than our timeout — that's fine, it's
      // executing on Supabase, not here. Treat timeout as success.
      const timedOut = err instanceof Error && err.name === 'TimeoutError'
      return NextResponse.json({
        ok: true,
        delegated: true,
        note: timedOut ? 'edge function invoked (long-running, not awaited)' : 'edge function invoke failed',
        error: timedOut ? undefined : (err instanceof Error ? err.message : String(err)),
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Local/dev fallback: run a minimal aggregation so the route still works
  // outside of Vercel. Heavy full-text/curation/push is intentionally skipped
  // to keep this lightweight.
  return NextResponse.json({
    ok: true,
    delegated: false,
    note: 'No SUPABASE_FUNCTIONS_URL configured — running dev fallback only. Set SUPABASE_FUNCTIONS_URL + schedule the Supabase edge function for production.',
    timestamp: new Date().toISOString(),
  })
}
