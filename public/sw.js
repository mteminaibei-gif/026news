/* eslint-disable no-console */
// 026News Push Notification Service Worker

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = {
      title: '026News',
      body: event.data.text(),
      url: '/',
      icon: '/logo.svg',
      badge: '/favicon.svg',
    }
  }

  const title = payload.title || '026News'
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/logo.svg',
    badge: payload.badge || '/favicon.svg',
    data: { url: payload.url || '/' },
    vibrate: [100, 50, 100],
    tag: payload.tag || '026news-push',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})

self.addEventListener('notificationclose', () => {
  // Analytics placeholder
})
