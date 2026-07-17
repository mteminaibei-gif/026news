import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter: max 30 SSE connections per IP per minute
const connTracker = new Map<string, { count: number; reset: number }>()
const MAX_CONN_PER_MIN = 30

function trimTracker() {
  const now = Date.now()
  if (connTracker.size > 10_000) {
    for (const [k, v] of connTracker) { if (now > v.reset) connTracker.delete(k) }
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = connTracker.get(ip)
  if (!entry || now > entry.reset) {
    trimTracker()
    connTracker.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= MAX_CONN_PER_MIN) return false
  entry.count++
  return true
}

/**
 * GET /api/sse/breaking-news
 *
 * Server-Sent Events stream. Sends:
 *   - An initial `init` event with the latest 10 published headlines
 *   - A `heartbeat` event every 25 s to keep the connection alive
 *   - A `breaking` event whenever a new article is published (polled every 10 s)
 *
 * Clients reconnect automatically via the EventSource API.
 */
export async function GET(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return new Response('Too Many Requests', { status: 429 })
  }

  const supabase = await createClient()

  // Fetch initial headlines
  const { data: initial } = await supabase
    .from('articles')
    .select('article_id, title, slug, created_at, category:categories(name)')
    .eq('status', 'published' as never)
    .order('created_at', { ascending: false })
    .limit(10)

  let lastArticleId: number = (initial as Array<{ article_id: number }>)?.[0]?.article_id ?? 0

  const encoder = new TextEncoder()

  function sseMsg(event: string, data: unknown): Uint8Array {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial headlines
      controller.enqueue(sseMsg('init', { articles: initial ?? [] }))

      // Heartbeat every 25 s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
          clearInterval(poller)
        }
      }, 25_000)

      // Poll for new published articles every 10 s
      const poller = setInterval(async () => {
        try {
          const { data: fresh } = await supabase
            .from('articles')
            .select('article_id, title, slug, created_at, category:categories(name)')
            .eq('status', 'published' as never)
            .gt('article_id', lastArticleId)
            .order('created_at', { ascending: false })
            .limit(5)

          if (fresh && fresh.length > 0) {
            const newest = fresh as Array<{ article_id: number; title: string; slug: string; created_at: string; category: { name: string } | null }>
            lastArticleId = Math.max(lastArticleId, ...newest.map(a => a.article_id))
            controller.enqueue(sseMsg('breaking', { articles: newest }))
          }
        } catch {
          // DB hiccup — skip this cycle, client keeps connection
        }
      }, 10_000)

      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clearInterval(poller)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':                'text/event-stream; charset=utf-8',
      'Cache-Control':               'no-cache, no-transform',
      'X-Accel-Buffering':           'no',         // disable nginx buffering
      'Connection':                  'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
