import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Activate new SW immediately
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Google Fonts — cache first, long TTL
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
)

// Guard: /assets/*.js and /assets/*.css must never be served as text/html.
// If the asset isn't in the precache (stale bundle from old deploy), let it
// reach the network. nginx now returns 404 for missing assets, so the
// browser will throw a proper fetch error instead of a MIME-type error.
// The ErrorBoundary catches that and shows "Atualizar app".
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only intercept same-origin /assets/ requests
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith('/assets/')) return

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      // Not in cache — go to network. With the new nginx config, missing assets
      // return 404 (not index.html), so the browser sees a proper error.
      return fetch(request).then(response => {
        // If the server returned HTML for an asset, something is very wrong.
        // Return a synthetic 404 to prevent a MIME-type crash.
        const ct = response.headers.get('content-type') || ''
        if (ct.includes('text/html')) {
          return new Response('Asset not found', {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'text/plain' },
          })
        }
        return response
      }).catch(() => new Response('Asset not found', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' },
      }))
    })
  )
})

// Allow pages to trigger SW update + cache clear
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data?.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    )
  }
})

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return
  let data
  try { data = event.data.json() } catch { return }

  event.waitUntil(
    self.registration.showNotification(data.title || 'The Archive', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/notifications' },
      tag: data.tag || 'the-archive-notification',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/notifications'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus()
        }
        if (self.clients.openWindow) return self.clients.openWindow(url)
      })
  )
})
