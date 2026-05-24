import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const rootDir = dirname(fileURLToPath(import.meta.url))

/** Підтягує .env.local для e2e (Supabase REST тощо). */
function loadEnvLocal() {
  const envPath = resolve(rootDir, '.env.local')
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvLocal()

/**
 * E2E для DImarket (Vite + SPA на window.location.pathname).
 *
 * Локально: піднімає `vite dev` на 4173 (див. webServer).
 * Прод / інший хост: PLAYWRIGHT_BASE_URL=https://dimarket.app npm run test:e2e
 */
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173)
const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${host}:${port}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'uk-UA',
    timezoneId: 'Europe/Kyiv',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: process.env.CI
          ? `npm run build && npm run preview -- --host ${host} --port ${port} --strictPort`
          : `npm run dev -- --host ${host} --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
