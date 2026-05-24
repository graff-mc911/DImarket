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
  const currentPath = `${window.location.pathname}${window.location.search}`

  if (currentPath === path) {
    pathListener?.(window.location.pathname)
    return
  }

  window.history.pushState({}, '', path)
  pathListener?.(window.location.pathname)

  // Для зовнішніх слухачів (Header, Footer) та кнопки «Назад»
  window.dispatchEvent(new PopStateEvent('popstate'))

  window.scrollTo({ top: 0, behavior: 'smooth' })
}
