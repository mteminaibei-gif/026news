import { NextRequest, NextResponse } from 'next/server'
import { handleMpesaCallback } from '@/lib/mpesa-stk'

/**
 * POST /api/mpesa/callback
 * Receives M-Pesa callback notifications
 * This is called by M-Pesa servers, not by client
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Handle the callback
    const result = await handleMpesaCallback(body)

    // M-Pesa requires immediate 200 response to acknowledge receipt
    return NextResponse.json(
      { success: true, result },
      { status: 200 }
    )
  } catch (error) {
    console.error('[POST /api/mpesa/callback] Error processing callback:', error)

    // Still return 200 to acknowledge, but log the error
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 200 } // Important: M-Pesa expects 200, not 500
    )
  }
}

/**
 * GET /api/mpesa/callback (optional)
 * For testing/debugging callback endpoint
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      message: 'M-Pesa callback endpoint is active',
      url: req.url,
      method: 'POST',
    },
    { status: 200 }
  )
}
