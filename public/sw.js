/* Minimal service worker for web push (Phase 1). */
self.addEventListener('push', (event) => {
  let data = { title: 'Dimarket', body: '' }
  try {
    if (event.data) data = event.data.json()
  } catch {
    data.body = event.data?.text() || ''
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Dimarket', {
      body: data.body || '',
      icon: '/favicon.ico',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(path))
})
