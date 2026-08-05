/**
 * Внутрішня навігація без повного перезавантаження сторінки (SPA-підхід).
 *
 * Синхронний pathListener потрібен, бо дочірні useEffect можуть викликати navigateTo
 * раніше, ніж App встигне підписатися на popstate.
 */
type PathListener = (path: string) => void

let pathListener: PathListener | null = null

export function bindPathListener(listener: PathListener | null): void {
  pathListener = listener
}

export function navigateTo(path: string): void {
  const hashIndex = path.indexOf('#')
  const hash = hashIndex >= 0 ? path.slice(hashIndex + 1) : ''
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path
  const currentPath = `${window.location.pathname}${window.location.search}`

  if (currentPath === pathWithoutHash && !hash) {
    pathListener?.(window.location.pathname)
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

  window.scrollTo({ top: 0, behavior: 'smooth' })
}
