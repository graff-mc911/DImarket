/* Service worker — required for desktop Chrome/Edge "Install app".
   Handles web push + a minimal fetch handler (installability criterion).

   Never intercept JS/CSS/modulepreload. Chrome + cached hashed Vite chunks
   causes "Failed to fetch dynamically imported module" and a reload loop
   (especially on lazy routes like /cost-estimator). */

const CACHE = 'dimarket-shell-v13'
const PRECACHE = ['/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

/** Network-first for HTML navigations only. Presence of fetch handler enables PWA install.
 *  Never intercept module/script fetches — Chrome import() hangs or throws if a worker
 *  touches hashed /assets/*.js (lazy CategoryPage / CostEstimator). */
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.mode !== 'navigate') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/assets/')) return
  if (/\.(js|mjs|cjs|css|map)(\?|$)/i.test(url.pathname)) return

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        if (res.ok) {
          void caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => undefined)
        }
        return res
      })
      .catch(async () => {
        const cached = await caches.match(req)
        if (cached) return cached
        const shell = await caches.match('/')
        if (shell) return shell
        return Response.error()
      }),
  )
})

self.addEventListener('push', (event) => {
  let data = { title: 'DImarket', body: '', url: '/messages' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    data.body = event.data?.text() || ''
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'DImarket', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/favicon-32.png',
      data: { url: data.url || '/messages' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.url || '/messages'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate?.(path)
          return client.focus()
        }
      }
      return clients.openWindow(path)
    }),
  )
})
