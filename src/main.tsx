/**
 * Точка входу React-застосунку.
 * Тут лише монтуємо кореневий компонент і підключаємо глобальні стилі.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Не знайдено елемент #root у index.html — перевірте розмітку.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)