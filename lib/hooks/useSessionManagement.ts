'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SessionData {
  sessionId: string
  userId: string
  email: string
  createdAt: string
  expiresAt: string
  lastActivity: string
  isActive: boolean
}

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const SESSION_WARNING = 5 * 60 * 1000 // 5 minutes before expiry

export function useSessionManagement() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [isWarning, setIsWarning] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const generateSessionId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const initializeSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user?.email) {
        setSession(null)
        setLoading(false)
        return
      }

      const now = new Date()
      const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT)

      const sessionData: SessionData = {
        sessionId: generateSessionId(),
        userId: user.id,
        email: user.email,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastActivity: now.toISOString(),
        isActive: true,
      }

      // Store in sessionStorage
      sessionStorage.setItem('026news-session', JSON.stringify(sessionData))
      setSession(sessionData)
      setLoading(false)
    } catch (err) {
      console.error('Error initializing session:', err)
      setLoading(false)
    }
  }, [supabase, generateSessionId])

  const updateActivity = useCallback(() => {
    const storedSession = sessionStorage.getItem('026news-session')
    if (!storedSession) return

    try {
      const sessionData = JSON.parse(storedSession) as SessionData
      const now = new Date()
      const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT)

      sessionData.lastActivity = now.toISOString()
      sessionData.expiresAt = expiresAt.toISOString()

      sessionStorage.setItem('026news-session', JSON.stringify(sessionData))
      setSession(sessionData)

      // Check if approaching expiry
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()
      setIsWarning(timeUntilExpiry <= SESSION_WARNING)
    } catch (err) {
      console.error('Error updating activity:', err)
    }
  }, [])

  const extendSession = useCallback(() => {
    updateActivity()
    setIsWarning(false)
  }, [updateActivity])

  const endSession = useCallback(async () => {
    sessionStorage.removeItem('026news-session')
    setSession(null)
    await supabase.auth.signOut()
  }, [supabase])

  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  // Track user activity
  useEffect(() => {
    const handleActivity = () => updateActivity()

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [updateActivity])

  // Check for session expiry
  useEffect(() => {
    const checkExpiry = setInterval(() => {
      const storedSession = sessionStorage.getItem('026news-session')
      if (!storedSession) return

      try {
        const sessionData = JSON.parse(storedSession) as SessionData
        const now = new Date()
        const expiresAt = new Date(sessionData.expiresAt)

        if (now >= expiresAt) {
          endSession()
        } else {
          const timeUntilExpiry = expiresAt.getTime() - now.getTime()
          setIsWarning(timeUntilExpiry <= SESSION_WARNING)
        }
      } catch (err) {
        console.error('Error checking session expiry:', err)
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(checkExpiry)
  }, [endSession])

  return {
    session,
    isWarning,
    loading,
    extendSession,
    endSession,
    updateActivity,
  }
}
