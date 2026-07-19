import { NextRequest, NextResponse } from 'next/server'
import { processQueue } from '@/lib/queue'

/**
 * POST /api/cron/process-queue
 * Processes jobs from the queue with retry logic
 * 
 * This endpoint is called by Vercel Cron or external cron service
 * Requires CRON_SECRET environment variable for security
 *
 * Vercel cron runs every 5 minutes
 */
export async function POST(req: NextRequest) {
  try {
    // Verify request is from Vercel Cron or authorized source
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.warn('[POST /api/cron/process-queue] CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    // Vercel Cron provides Bearer token
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[POST /api/cron/process-queue] Unauthorized cron attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process the queue
    const result = await processQueue()

    // Log results
    console.log('[Cron] Queue processing complete:', {
      processed: result.processed,
      failed: result.failed,
      total: result.total,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Queue processing completed',
        processed: result.processed,
        failed: result.failed,
        total: result.total,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('[POST /api/cron/process-queue] Error:', error)

    return NextResponse.json(
      {
        error: 'Queue processing failed',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/process-queue
 * For testing and status checks
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      message: 'Job queue processor endpoint is active',
      method: 'POST',
      authentication: 'Bearer token via CRON_SECRET',
      schedule: '*/5 * * * * (every 5 minutes recommended)',
    },
    { status: 200 }
  )
}
