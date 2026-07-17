// Service Worker for Push Notifications
// Place this in public/sw.js

const CACHE_NAME = '026connet!-v1'
const VAPID_PUBLIC_KEY = self.__VAPID_PUBLIC_KEY || ''

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const title = data.title || '026connet!'
    const options: NotificationOptions = {
      body: data.body || data.message || 'You have a new notification',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/badge-72.png',
      image: data.image,
      tag: data.tag || 'notification',
      renotify: data.renotify !== false,
      requireInteraction: data.requireInteraction !== false,
      actions: data.actions || [],
      data: data.data || {},
      vibrate: data.vibrate || [200, 100, 200],
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  } catch (err) {
    console.error('[SW] Push notification error:', err)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const action = event.action

  if (action === 'open' || action === 'reply' || !action) {
    const url = data.url || data.link || '/'

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        return clients.openWindow(url)
      })
    )
  }
})

self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {}
  if (data.notificationId) {
    fetch('/api/notifications/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: data.notificationId }),
    }).catch(() => {})
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache)
        })
        return response
      })
    })
  )
})