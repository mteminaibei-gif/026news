import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { APP_URL } from '@/lib/constants/app'

// In-memory rate limiter
const rateLimiter = new Map<string, { count: number; reset: number }>()
const MAX_REQUESTS = 3 // Max 3 requests per minute

function trimLimiter() {
  const now = Date.now()
  if (rateLimiter.size > 10_000) {
    for (const [k, v] of rateLimiter) { if (now > v.reset) rateLimiter.delete(k) }
  }
}

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimiter.get(ip)
  if (!entry || now > entry.reset) {
    trimLimiter()
    rateLimiter.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= MAX_REQUESTS) return false
  entry.count++
  return true
}

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

// POST /api/auth/forgot-password - Request password reset
export async function POST(req: NextRequest) {
  const ip = getIp(req)
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user exists - use explicit typing to avoid TS issues
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id, email, name')
      .eq('email', email.toLowerCase())
      .single() as { data: { user_id: number; email: string; name: string } | null }

    // For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    if (!existingUser) {
      return NextResponse.json({ 
        message: 'If an account with that email exists, you will receive a password reset link.' 
      })
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store token in database
    const tokenRecord = {
      user_id: existingUser.user_id,
      token,
      expires_at: expiresAt.toISOString(),
    }

    // Use admin client to insert token (bypass RLS)
    const admin = await createAdminClient()
    const { error: insertError } = await admin
      .from('password_reset_tokens')
      .insert(tokenRecord as never)

    if (insertError) {
      console.error('Failed to insert reset token:', insertError)
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }

    const resetLink = `${APP_URL}/reset-password?token=${token}`

    return NextResponse.json({ 
      message: 'If an account with that email exists, you will receive a password reset link.',
      ...(process.env.NODE_ENV === 'development' && { devResetLink: resetLink })
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// GET /api/auth/forgot-password - Verify token
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    const { data: resetToken } = await supabase
      .from('password_reset_tokens')
      .select('*, user:users(email, name)')
      .eq('token', token)
      .single() as { data: { id: number; user_id: number; token: string; expires_at: string; used_at: string | null; user: { email: string; name: string } } | null }

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    if (resetToken.used_at) {
      return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 })
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired' }, { status: 400 })
    }

    return NextResponse.json({ 
      valid: true, 
      email: resetToken.user?.email,
      name: resetToken.user?.name 
    })

  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.json({ error: 'Failed to verify token' }, { status: 500 })
  }
}