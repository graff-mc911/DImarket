import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

const ROLES = ['client', 'professional', 'company', 'advertiser'] as const

test.describe('Реєстрація — усі типи акаунтів', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPath(page, '/register')
  })

  for (const role of ROLES) {
    test(`UI: ${role} — форма та поля`, async ({ page }) => {
      await page.getByTestId(`register-role-${role}`).click()

      if (role === 'company') {
        await expect(page.getByPlaceholder(/BuildService|компанії|LLC|ТОВ/i)).toBeVisible()
      }

      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
    })
  }

  test('OAuth: Google і Apple', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Apple/i })).toBeVisible()
  })

  test('компанія: без назви — HTML required блокує submit', async ({ page }) => {
    await page.getByTestId('register-role-company').click()
    await page.locator('input[type="email"]').fill(`co-${Date.now()}@example.com`)
    await page.locator('input[type="password"]').fill('secret12')
    const companyInput = page.getByPlaceholder(/BuildService|компанії|LLC|ТОВ/i)
    await expect(companyInput).toHaveAttribute('required', '')
  })
})
