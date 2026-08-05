import { test, expect, devices } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173'
const EMAIL = process.env.E2E_USER_EMAIL || ''
const PASSWORD = process.env.E2E_USER_PASSWORD || ''

test.describe('Auth header + Account profile', () => {
  test('/profile without session does not throw t is not defined', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))
    await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
    const bodyText = (await page.locator('body').innerText()).trim()
    expect(bodyText.length).toBeGreaterThan(20)
    expect(pageErrors.some((e) => /t is not defined/i.test(e))).toBe(false)
  })

  test('mobile Account chip shows Sign in when logged out', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 13'] })
    const page = await context.newPage()
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(800)
    const mobileAccount = page.locator('div.sm\\:hidden button.amazon-header-block').first()
    await expect(mobileAccount).toBeVisible()
    await expect(mobileAccount).toContainText(/Sign in|Увійти|Войти|Iniciar/i)
    await context.close()
  })

  test('ErrorBoundary strings are in the production bundle', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    const hasBoundary = await page.evaluate(async () => {
      const scripts = Array.from(document.querySelectorAll('script[src]')).map(
        (s) => (s as HTMLScriptElement).src,
      )
      for (const src of scripts) {
        if (!src.includes('/assets/')) continue
        const text = await fetch(src).then((r) => r.text())
        if (text.includes('This page could not be loaded') || text.includes('Something went wrong')) {
          return true
        }
      }
      return false
    })
    expect(hasBoundary).toBe(true)
  })

  test('login → profile → refresh → navigate → logout → login', async ({ browser }) => {
    test.skip(!EMAIL || !PASSWORD, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD')

    const context = await browser.newContext({ ...devices['iPhone 13'] })
    const page = await context.newPage()
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    const header = () => page.locator('div.sm\\:hidden button.amazon-header-block').first()

    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
    await page.locator('.glass-panel input[type="email"]').fill(EMAIL)
    await page.locator('.glass-panel input[type="password"]').fill(PASSWORD)
    await page.locator('.glass-panel button[type="submit"]').click()
    await page.waitForTimeout(4000)

    let text = await header().innerText()
    expect(text.split('\n')[0].toLowerCase()).not.toMatch(/sign in|увійти|войти/)

    await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    expect((await page.locator('main').innerText()).trim().length).toBeGreaterThan(40)
    expect(pageErrors.some((e) => /t is not defined/i.test(e))).toBe(false)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    text = await header().innerText()
    expect(text.split('\n')[0].toLowerCase()).not.toMatch(/sign in|увійти|войти/)

    await page.goto(`${BASE}/listings`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
    text = await header().innerText()
    expect(text.split('\n')[0].toLowerCase()).not.toMatch(/sign in|увійти|войти/)

    await page.locator('div.sm\\:hidden button').filter({ has: page.locator('svg') }).last().click()
    await page.waitForTimeout(400)
    await page.locator('[class*="mobile-nav"]').getByRole('button', { name: /sign out|вийти|выйти/i }).click()
    await page.waitForTimeout(2000)
    text = await header().innerText()
    expect(text.toLowerCase()).toMatch(/sign in|увійти|войти|iniciar/)

    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
    await page.locator('.glass-panel input[type="email"]').fill(EMAIL)
    await page.locator('.glass-panel input[type="password"]').fill(PASSWORD)
    await page.locator('.glass-panel button[type="submit"]').click()
    await page.waitForTimeout(4000)
    text = await header().innerText()
    expect(text.split('\n')[0].toLowerCase()).not.toMatch(/sign in|увійти|войти/)

    await context.close()
  })
})
