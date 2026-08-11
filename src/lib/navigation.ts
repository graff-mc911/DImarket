/**
 * Внутрішня навігація без повного перезавантаження сторінки (SPA-підхід).
 *
 * Синхронний pathListener потрібен, бо дочірні useEffect можуть викликати navigateTo
 * раніше, ніж App встигне підписатися на popstate.
 */
type PathListener = (path: string) => void

let pathListener: PathListener | null = null

/** Prevent the browser from restoring the previous page's Y after SPA navigations. */
export function disableBrowserScrollRestoration(): void {
  if (typeof window === 'undefined') return
  try {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  } catch {
    /* ignore */
  }
}

/**
 * Jump to top instantly. Smooth CSS `scroll-behavior` + restored Y from a long
 * home page was landing mobile users on the footer of shorter destination pages.
 */
export function scrollToTop(): void {
  if (typeof window === 'undefined') return

  const active = document.activeElement
  if (active instanceof HTMLElement && active !== document.body) {
    active.blur()
  }

  const html = document.documentElement
  const previousBehavior = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'

  window.scrollTo(0, 0)
  html.scrollTop = 0
  document.body.scrollTop = 0

  html.style.scrollBehavior = previousBehavior
}

export function bindPathListener(listener: PathListener | null): void {
  pathListener = listener
}

export function navigateTo(path: string): void {
  const hashIndex = path.indexOf('#')
  const hash = hashIndex >= 0 ? path.slice(hashIndex + 1) : ''
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path
  const currentPath = `${window.location.pathname}${window.location.search}`

  disableBrowserScrollRestoration()

  if (currentPath === pathWithoutHash && !hash) {
    pathListener?.(window.location.pathname)
    scrollToTop()
    return
  }

  window.history.pushState({}, '', path)
  pathListener?.(window.location.pathname)

  // Для зовнішніх слухачів (Header, Footer) та кнопки «Назад»
  window.dispatchEvent(new PopStateEvent('popstate'))

  if (hash) {
    const scrollToHash = () => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    requestAnimationFrame(() => {
      scrollToHash()
      window.setTimeout(scrollToHash, 120)
    })
    return
  }

  scrollToTop()
  // After lazy route paint / layout, enforce top again (mobile Safari).
  requestAnimationFrame(() => {
    scrollToTop()
    window.setTimeout(scrollToTop, 50)
    window.setTimeout(scrollToTop, 200)
  })
}

disableBrowserScrollRestoration()
