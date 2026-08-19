/* Service worker — required for desktop Chrome/Edge "Install app".
   Handles web push + a minimal fetch handler (installability criterion).

   Never intercept JS/CSS/modulepreload. Chrome + cached hashed Vite chunks
   causes "Failed to fetch dynamically imported module" and a reload loop
   (especially on lazy routes like /cost-estimator). */

const CACHE = 'dimarket-shell-v6'
const PRECACHE = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

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
      ),
  )
  // Do not clients.claim() — Chrome aborts in-flight import() of lazy routes
  // (CostEstimator-*.js) when a new worker takes over the open page.
})

function shouldBypass(req, url) {
  if (req.method !== 'GET') return true
  if (url.origin !== self.location.origin) return true

  // Chrome import() often has destination "" not "script". Never intercept
  // hashed Vite modules — a cached index.html at this URL breaks Chrome forever.
  const dest = req.destination
  if (
    dest === 'script' ||
    dest === 'style' ||
    dest === '' ||
    dest === 'worker' ||
    dest === 'sharedworker' ||
    dest === 'audioworklet' ||
    dest === 'paintworklet'
  ) {
    return true
  }

  if (url.pathname.startsWith('/assets/')) return true
  if (url.pathname.startsWith('/src/')) return true
  if (url.pathname.startsWith('/api')) return true
  if (url.pathname.includes('supabase')) return true
  if (url.pathname.startsWith('/functions')) return true
  if (/\.(js|mjs|cjs|css|map)(\?|$)/i.test(url.pathname)) return true
  if (req.mode === 'cors') return true

  return false
}

/** Network-first for HTML/icons only. Presence of fetch handler enables PWA install. */
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (shouldBypass(req, url)) return

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        if (res.ok && (req.mode === 'navigate' || url.pathname.match(/\.(png|svg|ico|webmanifest)$/))) {
          void caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => undefined)
        }
        return res
      })
      .catch(async () => {
        const cached = await caches.match(req)
        if (cached) return cached
        if (req.mode === 'navigate') {
          const shell = await caches.match('/')
          if (shell) return shell
        }
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
