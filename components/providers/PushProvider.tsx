'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'

interface PushContextValue {
  subscription: PushSubscription | null
  isSupported: boolean
  isSubscribed: boolean
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  permission: NotificationPermission
}

const PushContext = createContext<PushContextValue | null>(null)

export function usePush() {
  const ctx = useContext(PushContext)
  if (!ctx) throw new Error('usePush must be used within PushProvider')
  return ctx
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
}

export function PushProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)
    setPermission(Notification.permission)

    if (supported) {
      checkSubscription()
    }
  }, [])

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        setSubscription(existing)
        setIsSubscribed(true)
      }
    } catch (err) {
      console.warn('[PushProvider] Failed to check subscription:', err)
    }
  }

  async function subscribe(): Promise<boolean> {
    if (!isSupported) return false

    try {
      if (Notification.permission === 'denied') {
        console.warn('[PushProvider] Notification permission denied')
        return false
      }

      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      if (!VAPID_PUBLIC_KEY) {
        console.error('[PushProvider] VAPID public key not configured')
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      const subJson = sub.toJSON()
      const p256dh = subJson.keys?.p256dh ?? ''
      const auth = subJson.keys?.auth ?? ''

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh,
          auth,
        }),
      })

      setSubscription(sub)
      setIsSubscribed(true)
      return true
    } catch (err) {
      console.error('[PushProvider] Subscribe failed:', err)
      return false
    }
  }

  async function unsubscribe(): Promise<boolean> {
    if (!subscription) return false

    try {
      await subscription.unsubscribe()
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })
      setSubscription(null)
      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error('[PushProvider] Unsubscribe failed:', err)
      return false
    }
  }

  return (
    <PushContext.Provider value={{ subscription, isSupported, isSubscribed, subscribe, unsubscribe, permission }}>
      {children}
    </PushContext.Provider>
  )
}