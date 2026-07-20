import { NextRequest, NextResponse } from 'next/server'
import { ALL_TV_STATIONS } from '@/lib/tv/stations'

/**
 * GET /api/tv/status
 * Get streaming status for all TV stations
 */
export async function GET(req: NextRequest) {
  try {
    // Station directory is static config; serve it edge-cached so repeated
    // client polls hit the CDN, not a Vercel function (keeps Fluid CPU low).
    const stationsWithStatus = ALL_TV_STATIONS.map(station => ({
      ...station,
      isLive: false,
      isOnline: false,
      viewers: 0,
      bitrate: 0,
      quality: 'auto',
      healthScore: 100,
      lastChecked: new Date().toISOString(),
    }))

    return NextResponse.json(
      {
        stations: stationsWithStatus,
        totalStations: stationsWithStatus.length,
        liveStations: 0,
        totalViewers: 0,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
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
