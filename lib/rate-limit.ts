import { kv } from '@vercel/kv'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

/**
 * Rate limit using Vercel KV (Redis)
 * Vercel KV is built into Vercel and works serverless
 * Falls back to in-process if KV unavailable (for local dev)
 */

const fallbackLimiter = new Map<string, { count: number; reset: number }>()

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  try {
    const now = Date.now()
    const kvKey = `ratelimit:${key}`

    // Try to use Vercel KV
    const current = await kv.incr(kvKey)

    // Set expiration on first request
    if (current === 1) {
      await kv.expire(kvKey, windowSeconds)
    }

    // Get TTL
    const ttl = await kv.ttl(kvKey)
    const resetAt = now + Math.max(ttl * 1000, 0)

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt,
      retryAfter: current > limit ? Math.ceil((resetAt - now) / 1000) : undefined,
    }
  } catch (error) {
    // Fallback to in-process for local development
    return checkRateLimitFallback(key, limit, windowSeconds)
  }
}

function checkRateLimitFallback(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now()
  const entry = fallbackLimiter.get(key)

  if (!entry || now > entry.reset) {
    fallbackLimiter.set(key, { count: 1, reset: now + windowSeconds * 1000 })
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowSeconds * 1000,
    }
  }

  entry.count++
  const allowed = entry.count <= limit

  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.reset,
    retryAfter: !allowed ? Math.ceil((entry.reset - now) / 1000) : undefined,
  }
}

/**
 * Extract client IP from request
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * Rate limit presets for common endpoints
 */
export const RATE_LIMITS = {
  PUBLIC_GET: { limit: 60, window: 60 }, // 60 requests per minute
  PUBLIC_POST: { limit: 10, window: 60 }, // 10 requests per minute
  AUTH: { limit: 5, window: 60 }, // 5 login attempts per minute
  PAYMENT: { limit: 3, window: 60 }, // 3 payment attempts per minute
  UPLOAD: { limit: 5, window: 60 }, // 5 uploads per minute
} as const
