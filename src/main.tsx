/**
 * Точка входу React-застосунку.
 * Тут лише монтуємо кореневий компонент і підключаємо глобальні стилі.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { applyAdSlotCssVars } from './lib/adSlotCssVars'
import { ensureLanguageLoaded, resolveUiLanguageCode } from './lib/i18n'
import { initMonitoring } from './lib/monitoring'
import { disableBrowserScrollRestoration } from './lib/navigation'
import { registerServiceWorker } from './lib/pwa'
import './index.css'

const rootElement = document.getElementById('root')

if (typeof document !== 'undefined') {
  applyAdSlotCssVars()
  disableBrowserScrollRestoration()
  registerServiceWorker()
}

if (!rootElement) {
  throw new Error('Не знайдено елемент #root у index.html — перевірте розмітку.')
}

async function boot() {
  void initMonitoring()

  const saved =
    typeof localStorage !== 'undefined' ? localStorage.getItem('dimarket_language') : null
  await ensureLanguageLoaded(resolveUiLanguageCode(saved))

  createRoot(rootElement!).render(
    <StrictMode>
      <ErrorBoundary
        name="Root"
        fallbackTitle="DImarket could not start"
        fallbackMessage="Please reload the page. If the problem continues, try again later."
      >
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}

void boot()
