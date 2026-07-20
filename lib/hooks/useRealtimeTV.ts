import { useEffect, useState, useCallback, useRef } from 'react'
import type { TVStationStatus, TVStreamMetrics } from '@/lib/tv/realtime-manager'

interface UseRealtimeTVOptions {
  stationId: string
  onStatusChange?: (status: TVStationStatus) => void
  onMetricsUpdate?: (metrics: TVStreamMetrics) => void
  pollInterval?: number
}

interface RealtimeTVState {
  status: TVStationStatus | null
  metrics: TVStreamMetrics | null
  isLive: boolean
  viewers: number
  healthScore: number
  lastUpdate: Date | null
  loading: boolean
  error: string | null
}

/**
 * Hook for real-time TV streaming data
 * Polls API and updates component with live status
 */
export function useRealtimeTV({
  stationId,
  onStatusChange,
  onMetricsUpdate,
  pollInterval = 120000, // 2 minutes — keep Vercel Fluid CPU low on free tier
}: UseRealtimeTVOptions) {
  const [state, setState] = useState<RealtimeTVState>({
    status: null,
    metrics: null,
    isLive: false,
    viewers: 0,
    healthScore: 100,
    lastUpdate: null,
    loading: true,
    error: null,
  })

  const pollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/tv/stream-health/${stationId}`,
        {
          signal: abortControllerRef.current?.signal,
        }
      )

      if (!response.ok) throw new Error('Failed to fetch status')

      const data = await response.json()

      setState(prev => {
        const newState = {
          ...prev,
          status: data,
          isLive: data.isLive,
          viewers: data.viewers || 0,
          healthScore: data.healthScore || 100,
          lastUpdate: new Date(),
          loading: false,
          error: data.error || null,
        }

        onStatusChange?.(data)
        return newState
      })
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }))
      }
    }
  }, [stationId, onStatusChange])

  const recordMetrics = useCallback(
    async (metrics: Partial<TVStreamMetrics>) => {
      try {
        const response = await fetch('/api/tv/viewer-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stationId,
            action: 'update',
            metrics,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          onMetricsUpdate?.(data)
        }
      } catch (error) {
        console.warn('Failed to record metrics:', error)
      }
    },
    [stationId, onMetricsUpdate]
  )

  const recordViewer = useCallback(
    async (action: 'join' | 'leave') => {
      try {
        await fetch('/api/tv/viewer-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stationId,
            action,
          }),
        })
      } catch (error) {
        console.warn('Failed to record viewer:', error)
      }
    },
    [stationId]
  )

  // Initial fetch
  useEffect(() => {
    abortControllerRef.current = new AbortController()
    fetchStatus()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [fetchStatus, stationId])

  // Polling
  useEffect(() => {
    pollTimeoutRef.current = setInterval(fetchStatus, pollInterval)

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current)
      }
    }
  }, [fetchStatus, pollInterval])

  // Record viewer join on mount
  useEffect(() => {
    recordViewer('join')

    return () => {
      recordViewer('leave')
    }
  }, [stationId, recordViewer])

  return {
    ...state,
    refresh: fetchStatus,
    recordMetrics,
    recordViewer,
  }
}

/**
 * Hook for getting all TV statuses
 */
export function useAllTVStatus(pollInterval = 120000) {
  const [statuses, setStatuses] = useState<TVStationStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllStatus = async () => {
      try {
        const response = await fetch('/api/tv/status')
        if (!response.ok) throw new Error('Failed to fetch status')

        const data = await response.json()
        setStatuses(data.stations || [])
        setError(null)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchAllStatus()
    const interval = setInterval(fetchAllStatus, pollInterval)

    return () => clearInterval(interval)
  }, [pollInterval])

  return { statuses, loading, error }
}
