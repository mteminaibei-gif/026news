import { NextRequest, NextResponse } from 'next/server'
import { tvRealtimeManager } from '@/lib/tv/realtime-manager'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/tv/viewer-metrics
 * Track viewer engagement and streaming metrics
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(req.headers)
    const rateLimitResult = await checkRateLimit(
      `tv:metrics:${ip}`,
      30,  // 30 requests per minute
      60
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const {
      stationId,
      action, // 'join' | 'leave'
      metrics: {
        bitrate,
        quality,
        buffered,
        currentTime,
        duration,
      },
    } = body

    if (!stationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize if needed
    if (!tvRealtimeManager.getStatus(stationId)) {
      tvRealtimeManager.initStation(stationId)
    }

    // Record viewer activity
    if (action === 'join') {
      tvRealtimeManager.recordViewer(stationId, { joined: true })
    } else if (action === 'leave') {
      tvRealtimeManager.recordViewer(stationId, { left: true })
    }

    // Update metrics
    if (bitrate !== undefined || quality !== undefined || buffered !== undefined) {
      tvRealtimeManager.updateMetrics(stationId, {
        bitrate: bitrate || 0,
        quality: quality || 'auto',
        buffered: buffered || 0,
        currentTime: currentTime || 0,
        duration: duration || 0,
      })
    }

    const status = tvRealtimeManager.getStatus(stationId)

    return NextResponse.json({
      success: true,
      status: {
        viewers: status?.viewers || 0,
        isLive: status?.isLive || false,
        healthScore: status?.healthScore || 100,
      },
    })
  } catch (error) {
    console.error('[TV Viewer Metrics]', error)
    return NextResponse.json(
      { error: 'Failed to record metrics' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tv/viewer-metrics
 * Get all streaming metrics
 */
export async function GET(req: NextRequest) {
  try {
    const statuses = tvRealtimeManager.getAllStatuses()

    return NextResponse.json({
      stations: statuses.map(s => ({
        stationId: s.stationId,
        isLive: s.isLive,
        viewers: s.viewers,
        bitrate: s.bitrate,
        quality: s.quality,
        healthScore: s.healthScore,
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[TV Metrics GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
