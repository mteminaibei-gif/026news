/**
 * Real-time TV streaming manager
 * Handles WebSocket connections, live status tracking, and streaming metrics
 */

export interface TVStreamMetrics {
  stationId: string
  viewers: number
  bitrate: number
  buffered: number
  currentTime: number
  duration: number
  quality: 'auto' | '720p' | '1080p' | '480p'
  isLive: boolean
  lastUpdated: Date
}

export interface TVStationStatus {
  stationId: string
  isOnline: boolean
  isLive: boolean
  viewers: number
  bitrate: number
  quality: string
  lastChecked: Date
  healthScore: number
  failureCount: number
}

class TVRealtimeManager {
  private statusMap = new Map<string, TVStationStatus>()
  private metricsMap = new Map<string, TVStreamMetrics>()
  private websockets = new Map<string, WebSocket>()
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>()
  private updateCallbacks = new Map<string, Set<(status: TVStationStatus) => void>>()

  /**
   * Initialize real-time tracking for a TV station
   */
  initStation(stationId: string) {
    if (this.statusMap.has(stationId)) return

    this.statusMap.set(stationId, {
      stationId,
      isOnline: false,
      isLive: false,
      viewers: 0,
      bitrate: 0,
      quality: 'auto',
      lastChecked: new Date(),
      healthScore: 100,
      failureCount: 0,
    })

    this.metricsMap.set(stationId, {
      stationId,
      viewers: 0,
      bitrate: 0,
      buffered: 0,
      currentTime: 0,
      duration: 0,
      quality: 'auto',
      isLive: false,
      lastUpdated: new Date(),
    })

    this.updateCallbacks.set(stationId, new Set())
  }

  /**
   * Start health check for a station
   */
  startHealthCheck(stationId: string, interval = 30000) {
    if (this.healthCheckIntervals.has(stationId)) return

    const check = async () => {
      try {
        const status = this.statusMap.get(stationId)
        if (!status) return

        // Check stream health via API
        const response = await fetch(`/api/tv/stream-health/${stationId}`)
        const data = await response.json()

        // Update status
        status.isOnline = data.isOnline
        status.isLive = data.isLive
        status.viewers = data.viewers || 0
        status.bitrate = data.bitrate || 0
        status.quality = data.quality || 'auto'
        status.lastChecked = new Date()
        status.healthScore = Math.max(0, status.healthScore - (data.error ? 10 : 0) + (data.isLive ? 5 : 0))
        status.failureCount = data.error ? status.failureCount + 1 : 0

        // Notify listeners
        this.notifyListeners(stationId, status)
      } catch (error) {
        console.error(`Health check failed for ${stationId}:`, error)
        const status = this.statusMap.get(stationId)
        if (status) {
          status.failureCount++
          status.healthScore = Math.max(0, status.healthScore - 5)
          this.notifyListeners(stationId, status)
        }
      }
    }

    // Run immediately
    check()

    // Then on interval
    const intervalId = setInterval(check, interval)
    this.healthCheckIntervals.set(stationId, intervalId)
  }

  /**
   * Stop health check for a station
   */
  stopHealthCheck(stationId: string) {
    const intervalId = this.healthCheckIntervals.get(stationId)
    if (intervalId) {
      clearInterval(intervalId)
      this.healthCheckIntervals.delete(stationId)
    }
  }

  /**
   * Update streaming metrics for a station
   */
  updateMetrics(stationId: string, metrics: Partial<TVStreamMetrics>) {
    const current = this.metricsMap.get(stationId)
    if (!current) return

    const updated = { ...current, ...metrics, lastUpdated: new Date() }
    this.metricsMap.set(stationId, updated)

    // Update status based on metrics
    const status = this.statusMap.get(stationId)
    if (status) {
      status.bitrate = updated.bitrate
      status.quality = updated.quality as any
      this.notifyListeners(stationId, status)
    }
  }

  /**
   * Get current status for a station
   */
  getStatus(stationId: string): TVStationStatus | undefined {
    return this.statusMap.get(stationId)
  }

  /**
   * Get metrics for a station
   */
  getMetrics(stationId: string): TVStreamMetrics | undefined {
    return this.metricsMap.get(stationId)
  }

  /**
   * Get all statuses
   */
  getAllStatuses(): TVStationStatus[] {
    return Array.from(this.statusMap.values())
  }

  /**
   * Subscribe to status updates
   */
  subscribe(stationId: string, callback: (status: TVStationStatus) => void) {
    if (!this.updateCallbacks.has(stationId)) {
      this.updateCallbacks.set(stationId, new Set())
    }
    this.updateCallbacks.get(stationId)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(stationId)
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  /**
   * Notify listeners of status changes
   */
  private notifyListeners(stationId: string, status: TVStationStatus) {
    const callbacks = this.updateCallbacks.get(stationId)
    if (callbacks) {
      callbacks.forEach(cb => cb(status))
    }
  }

  /**
   * Record viewer metrics
   */
  recordViewer(stationId: string, data: { joined?: boolean; left?: boolean }) {
    const metrics = this.metricsMap.get(stationId)
    const status = this.statusMap.get(stationId)

    if (metrics && status) {
      if (data.joined) {
        metrics.viewers++
        status.viewers++
      } else if (data.left) {
        metrics.viewers = Math.max(0, metrics.viewers - 1)
        status.viewers = Math.max(0, status.viewers - 1)
      }
      this.notifyListeners(stationId, status)
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.healthCheckIntervals.forEach(intervalId => clearInterval(intervalId))
    this.healthCheckIntervals.clear()
    this.websockets.forEach(ws => ws.close())
    this.websockets.clear()
  }
}

// Singleton instance
export const tvRealtimeManager = new TVRealtimeManager()
