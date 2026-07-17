import webPush from 'web-push'

const VAPID_PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT ?? 'mailto:admin@026news.vercel.app'

let configured = false

function ensureConfigured() {
  if (configured) return
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys not configured')
  }
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  configured = true
}

export interface PushPayload {
  title: string
  body: string
  url: string
  icon?: string
  badge?: string
}

export interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
): Promise<{ ok: boolean; stale?: boolean }> {
  ensureConfigured()

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  }

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    icon: payload.icon ?? '/logo.svg',
    badge: payload.badge ?? '/favicon.svg',
  })

  try {
    await webPush.sendNotification(pushSubscription, data, {
      TTL: 60 * 60 * 24,
      headers: { 'Content-Type': 'application/json' },
    })
    return { ok: true }
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, stale: true }
    }
    console.error('[push] send failed:', statusCode ?? err)
    return { ok: false }
  }
}

export async function sendPushToAll(
  subscriptions: PushSubscription[],
  payload: PushPayload,
): Promise<{ sent: number; stale: number; staleEndpoints: string[] }> {
  let sent = 0
  let stale = 0
  const staleEndpoints: string[] = []

  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPushNotification(sub, payload)),
  )

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'fulfilled') {
      if (result.value.ok) sent++
      if (result.value.stale) {
        stale++
        staleEndpoints.push(subscriptions[i].endpoint)
      }
    }
  }

  return { sent, stale, staleEndpoints }
}
