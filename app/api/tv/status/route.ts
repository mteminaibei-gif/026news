import { NextRequest, NextResponse } from 'next/server'
import { tvRealtimeManager } from '@/lib/tv/realtime-manager'
import { ALL_TV_STATIONS } from '@/lib/tv/stations'

/**
 * GET /api/tv/status
 * Get streaming status for all TV stations
 */
export async function GET(req: NextRequest) {
  try {
    // Initialize all stations if not already done
    ALL_TV_STATIONS.forEach(station => {
      if (!tvRealtimeManager.getStatus(station.id)) {
        tvRealtimeManager.initStation(station.id)
        tvRealtimeManager.startHealthCheck(station.id, 45000) // Check every 45 seconds
      }
    })

    // Get status for all stations
    const statuses = tvRealtimeManager.getAllStatuses().map(status => ({
      stationId: status.stationId,
      isLive: status.isLive,
      isOnline: status.isOnline,
      viewers: status.viewers,
      bitrate: status.bitrate,
      quality: status.quality,
      healthScore: status.healthScore,
      lastChecked: status.lastChecked.toISOString(),
    }))

    // Get station details
    const stationsWithStatus = ALL_TV_STATIONS.map(station => {
      const status = statuses.find(s => s.stationId === station.id)
      return {
        ...station,
        ...status,
      }
    })

    return NextResponse.json(
      {
        stations: stationsWithStatus,
        totalStations: stationsWithStatus.length,
        liveStations: stationsWithStatus.filter(s => s.isLive).length,
        totalViewers: stationsWithStatus.reduce((sum, s) => sum + (s.viewers || 0), 0),
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=20',
        },
      }
    )
  } catch (error) {
    console.error('[TV Status]', error)
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
