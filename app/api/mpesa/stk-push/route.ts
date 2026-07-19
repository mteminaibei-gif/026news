import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { initiateSTKPush } from '@/lib/mpesa-stk'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'
import { mpesaPaymentSchema, formatValidationError } from '@/lib/validation'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/mpesa/stk-push
 * Initiates an M-Pesa STK push payment request
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit payment attempts
    const ip = getClientIp(req.headers)
    const rateLimitResult = await checkRateLimit(
      `mpesa:stk:${ip}`,
      RATE_LIMITS.PAYMENT.limit,
      RATE_LIMITS.PAYMENT.window
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many payment attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate with schema
    const validated = mpesaPaymentSchema.parse(body)

    // Initiate STK push
    const result = await initiateSTKPush({
      phoneNumber: validated.phoneNumber,
      amount: validated.amount,
      orderId: validated.orderId,
      description: validated.description,
    })

    return NextResponse.json(
      {
        success: true,
        checkoutRequestID: result.CheckoutRequestID,
        message: result.CustomerMessage,
        data: {
          CheckoutRequestID: result.CheckoutRequestID,
          ResponseCode: result.ResponseCode,
          ResponseDescription: result.ResponseDescription,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    )
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatValidationError(error),
        { status: 400 }
      )
    }

    // Handle M-Pesa API errors
    if (error instanceof Error) {
      console.error('[POST /api/mpesa/stk-push] Error:', error.message)

      return NextResponse.json(
        {
          error: error.message || 'M-Pesa payment initiation failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      )
    }

    console.error('[POST /api/mpesa/stk-push] Unknown error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
