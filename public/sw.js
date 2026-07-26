/* Service worker for web push + offline shell. */
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
