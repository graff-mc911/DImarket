/** Register service worker on every visit so desktop Chrome/Edge can Install. */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  const register = () => {
    // Delay until after lazy route import() can finish. Immediate skipWaiting +
    // claim on load aborts CostEstimator-*.js in Chrome.
    window.setTimeout(() => {
      void navigator.serviceWorker.register('/sw.js?v=8', { scope: '/' }).catch((err) => {
        console.warn('[pwa] service worker registration failed', err)
      })
    }, 4000)
  }

  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}
