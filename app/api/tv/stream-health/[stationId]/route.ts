import { NextRequest, NextResponse } from 'next/server'
import { tvRealtimeManager } from '@/lib/tv/realtime-manager'

/**
 * GET /api/tv/stream-health/[stationId]
 * Check if a TV station stream is healthy and live
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  try {
    const { stationId } = await params

    // Initialize if not already done
    if (!tvRealtimeManager.getStatus(stationId)) {
      tvRealtimeManager.initStation(stationId)
    }

    const status = tvRealtimeManager.getStatus(stationId)
    const metrics = tvRealtimeManager.getMetrics(stationId)

    if (!status || !metrics) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      stationId,
      isOnline: status.isOnline,
      isLive: status.isLive,
      viewers: status.viewers,
      bitrate: status.bitrate,
      quality: status.quality,
      healthScore: status.healthScore,
      buffered: metrics.buffered,
      currentTime: metrics.currentTime,
      lastChecked: status.lastChecked,
      error: status.failureCount > 0 ? `${status.failureCount} failures` : null,
    })
  } catch (error) {
    console.error('[TV Health Check]', error)
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    )
  }
}
