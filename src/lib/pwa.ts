/** Register service worker on every visit so desktop Chrome/Edge can Install. */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  const register = () => {
    void navigator.serviceWorker.register('/sw.js?v=5', { scope: '/' }).catch((err) => {
      console.warn('[pwa] service worker registration failed', err)
    })
  }

  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}
