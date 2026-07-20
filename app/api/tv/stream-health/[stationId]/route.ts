import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/tv/stream-health/[stationId]
 * Lightweight, edge-cached health placeholder. On Vercel serverless there is
 * no shared in-memory TV state, so we return a cached default instead of
 * spinning up a function on every client poll (keeps Fluid CPU low).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  try {
    const { stationId } = await params

    return NextResponse.json(
      {
        stationId,
        isOnline: false,
        isLive: false,
        viewers: 0,
        bitrate: 0,
        quality: 'auto',
        healthScore: 100,
        buffered: 0,
        currentTime: 0,
        lastChecked: new Date().toISOString(),
        error: null,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('[TV Health Check]', error)
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    )
  }
}
