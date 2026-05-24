import { expect, type Page } from '@playwright/test'

/** Стабільний знак шапки (у header два SVG — mobile/desktop). */
export const LOGO = { role: 'img' as const, name: 'DImarket logo' }

export function headerLogo(page: Page) {
  return page.locator('header').getByRole(LOGO.role, { name: LOGO.name }).first()
}

/** Заголовок hero на головній (UK або EN). */
export const HOME_HERO = /Знайдіть майстра|Find a master/i

export async function expectAppShell(page: Page) {
  await expect(headerLogo(page)).toBeVisible()
  await expect(page.locator('footer')).toBeVisible()
}

export async function clickHeaderLogo(page: Page) {
  await page
    .locator('header button:has([aria-label="DImarket logo"])')
    .first()
    .click()
}

/** Основна навігація в шапці (не footer / hero). Видна лише на lg+ (≥1024px). */
export function headerNav(page: Page) {
  return page.locator('header').getByRole('navigation').first()
}

const DESKTOP_HEADER_NAV_MIN_WIDTH = 1024

/** Панель пунктів у розгорнутому мобільному меню (бургер). */
export function mobileHeaderNavPanel(page: Page) {
  return page.locator('header').locator('div.border-t.lg\\:hidden')
}

export async function openMobileHeaderMenu(page: Page) {
  const toggle = page.locator('header button[aria-expanded]').first()
  await expect(toggle).toBeVisible()
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click()
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(mobileHeaderNavPanel(page)).toBeVisible()
}

/** Клік по пункту нижньої навігації шапки (desktop nav або мобільне меню). */
export async function clickHeaderNavButton(
  page: Page,
  name: RegExp,
  viewport?: { width?: number; height?: number } | null,
) {
  const width = viewport?.width ?? DESKTOP_HEADER_NAV_MIN_WIDTH

  if (width >= DESKTOP_HEADER_NAV_MIN_WIDTH) {
    await headerNav(page).getByRole('button', { name }).click()
    return
  }

  await openMobileHeaderMenu(page)
  await mobileHeaderNavPanel(page).getByRole('button', { name }).click()
}

export async function gotoPath(page: Page, path: string) {
  await page.goto(path)
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
  await expectAppShell(page)
}
