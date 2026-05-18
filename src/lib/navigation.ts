/**
 * Внутрішня навігація без повного перезавантаження сторінки (SPA-підхід).
 *
 * Важливо: після pushState ми штучно викликаємо подію `popstate`, бо деякі браузери
 * не роблять цього автоматично. Компоненти (наприклад, App) слухають `popstate`
 * і оновлюють відображувану сторінку.
 */
export function navigateTo(path: string): void {
  const currentPath = `${window.location.pathname}${window.location.search}`

  // Якщо користувач уже на цій адресі — не оновлюємо історію зайвий раз
  if (currentPath === path) {
    return
  }

  window.history.pushState({}, '', path)

  // Повідомляємо додаток про зміну маршруту (той самий механізм, що й «Назад» у браузері)
  window.dispatchEvent(new PopStateEvent('popstate'))

  // На мобільних зручно одразу повертати користувача на початок нового екрана
  window.scrollTo({ top: 0, behavior: 'smooth' })
}