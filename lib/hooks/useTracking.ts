'use client'

import { useEffect, useRef, useCallback } from 'react'

const API = '/api/analytics/track'

let activeSessionId: string | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
const seenPages = new Set<string>()

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  if (!activeSessionId) {
    activeSessionId = sessionStorage.getItem('036_session_id')
    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem('036_session_id', activeSessionId)
    }
  }
  return activeSessionId
}

function send(data: Record<string, unknown>) {
  try {
    const sid = getSessionId()
    if (!sid) return
    navigator.sendBeacon?.(API, new Blob([JSON.stringify({ ...data, session_id: sid })], { type: 'application/json' }))
  } catch { /* best-effort */ }
}

function startHeartbeat() {
  if (heartbeatTimer) return
  heartbeatTimer = setInterval(() => send({ type: 'heartbeat' }), 30_000)
}

function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
}

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') send({ type: 'leave' })
    else startHeartbeat()
  })
  window.addEventListener('beforeunload', () => send({ type: 'leave' }))
}

export function usePageView(pathname: string) {
  const lastPath = useRef(pathname)

  useEffect(() => {
    if (!pathname) return
    const key = `${pathname}::${new Date().toISOString().slice(0, 10)}`
    if (!seenPages.has(key)) {
      seenPages.add(key)
      send({ type: 'pageview', page: pathname })
    }
    startHeartbeat()
    lastPath.current = pathname

    return () => { /* no cleanup needed, heartbeat continues */ }
  }, [pathname])
}

export function trackAdImpression(adId: string, slot: string) {
  send({ type: 'ad_impression', ad_id: adId, slot })
}

export function trackAdClick(adId: string, slot: string) {
  send({ type: 'ad_click', ad_id: adId, slot })
}

export function trackEvent(event: string, meta?: Record<string, unknown>) {
  send({ type: 'event', event, ...meta })
}
