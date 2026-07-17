import webpush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@026news.co.ke',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, any>
  actions?: Array<{ action: string; title: string; icon?: string }>
  tag?: string
  renotify?: boolean
  requireInteraction?: boolean
  vibrate?: number[]
}

export async function sendPushNotification(
  userId: number,
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured, skipping push notification')
    return false
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    interface PushSubscriptionRow {
      endpoint: string
      p256dh: string
      auth: string
    }

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId) as { data: PushSubscriptionRow[] | null; error: any }

    if (!subscriptions || subscriptions.length === 0) {
      return false
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify(payload)
          )
          return true
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired/invalid, remove it
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
          }
          return false
        }
      })
    )

    return results.some(r => r.status === 'fulfilled' && r.value === true)
  } catch (err) {
    console.error('[Push] sendPushNotification error:', err)
    return false
  }
}

export async function sendPushToMultiple(
  userIds: number[],
  payload: PushPayload
): Promise<number> {
  if (!userIds.length) return 0

  const results = await Promise.allSettled(
    userIds.map(id => sendPushNotification(id, payload))
  )

  return results.filter(
    r => r.status === 'fulfilled' && r.value === true
  ).length
}