import { test, expect, type Page } from '@playwright/test'
import { expectAppShell, expectNoHorizontalOverflow, gotoPath } from './helpers'

const DESKTOP = [
  { width: 1640, height: 900 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1200, height: 800 },
  { width: 1024, height: 768 },
] as const

const MOBILE = [
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 360, height: 800 },
] as const

const DEPT_ITEMS = [
  /Categories|Категорії/i,
  /Today'?s Deals|Актуальні запити/i,
  /Find Professionals|Знайти майстр/i,
  /^Companies$|^Компан/i,
  /Manufacturers|Виробник/i,
  /^Jobs$|^Вакансії$/i,
  /Cost estimator|Калькулятор вартості/i,
  /^Sell$|^Опублікувати$/i,
  /Analytics|Аналітика/i,
]

const REMOVED_DEPT_ITEMS = [
  /^Map$|^Карта$/i,
  /Commercial Agents|Комерційн/i,
  /Post a job|Опублікувати запит/i,
  /Pricing|Тарифи/i,
  /AI assistant|AI-помічник/i,
  /Customer Service|Підтримка/i,
  /How It Works|Як це працює/i,
]

function bottomNav(page: Page) {
  return page.locator('nav.mobile-bottom-nav')
}

function deptNav(page: Page) {
  return page.locator('header nav.amazon-dept-scroll')
}

async function assertDeptItemReachable(page: Page, name: RegExp) {
  const item = deptNav(page).getByRole('button', { name }).first()
  await expect(item).toBeVisible()
  const box = await item.boundingBox()
  expect(box, String(name)).toBeTruthy()
  const vw = page.viewportSize()?.width ?? 0
  const vh = page.viewportSize()?.height ?? 0
  expect(box!.width, String(name)).toBeGreaterThan(8)
  expect(box!.x + box!.width, `${String(name)} still off-screen`).toBeGreaterThan(0)
  expect(box!.x, `${String(name)} still off-screen`).toBeLessThan(vw)
  expect(box!.y, `${String(name)} below viewport`).toBeLessThan(vh)
  expect(box!.y + box!.height, `${String(name)} above viewport`).toBeGreaterThan(0)
}

test.describe('Desktop header chrome (lg+)', () => {
  for (const vp of DESKTOP) {
    test(`no mobile tab bar; all dept items reachable at ${vp.width}x${vp.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(vp)
      await gotoPath(page, '/')

      await expect(bottomNav(page)).toHaveCount(0)
      await expect(page.locator('.mobile-nav-more')).toHaveCount(0)

      await expect(page.locator('header').getByRole('img', { name: /DImarket logo/i })).toBeVisible()
      await expect(page.locator('.header-location button')).toBeVisible()
      await expect(page.locator('header input[type="search"]').first()).toBeVisible()
      await expect(page.getByRole('button', { name: /Sign in|Увійти|Hello|Вітаємо/i }).first()).toBeVisible()

      await expect(deptNav(page)).toBeVisible()
      const deptStyle = await deptNav(page).evaluate((el) => {
        const s = getComputedStyle(el)
        const rows = [...el.querySelectorAll('.amazon-dept-row')]
        const buttons = [...el.querySelectorAll('button')]
        const visualRows = new Set(buttons.map((b) => Math.round(b.getBoundingClientRect().top / 4) * 4))
        const counts = rows.map((row) => row.querySelectorAll('button').length)
        const lastRow = rows.at(-1)
        let lastRowCentered = true
        if (lastRow) {
          const lastButtons = [...lastRow.querySelectorAll('button')]
          if (lastButtons.length) {
            const first = lastButtons[0].getBoundingClientRect()
            const last = lastButtons[lastButtons.length - 1].getBoundingClientRect()
            const mid = (first.left + last.right) / 2
            lastRowCentered = Math.abs(mid - window.innerWidth / 2) < window.innerWidth * 0.22
          }
        }
        return {
          flexDirection: s.flexDirection,
          overflowX: s.overflowX,
          visualRows: visualRows.size,
          counts,
          lastRowCentered,
          justify: rows[0] ? getComputedStyle(rows[0]).justifyContent : '',
        }
      })
      expect(deptStyle.flexDirection).toBe('column')
      expect(deptStyle.overflowX).toBe('visible')
      expect(deptStyle.justify).toBe('center')
      expect(deptStyle.visualRows).toBeGreaterThanOrEqual(2)
      expect(deptStyle.visualRows).toBeLessThanOrEqual(4)
      expect(Math.abs((deptStyle.counts[0] ?? 0) - (deptStyle.counts[1] ?? 0))).toBeLessThanOrEqual(1)
      expect(deptStyle.lastRowCentered, `second row not centered ${JSON.stringify(deptStyle)}`).toBe(true)

      for (const name of DEPT_ITEMS) {
        await assertDeptItemReachable(page, name)
      }
      for (const name of REMOVED_DEPT_ITEMS) {
        await expect(deptNav(page).getByRole('button', { name })).toHaveCount(0)
      }

      await expectNoHorizontalOverflow(page)
    })
  }
})

test.describe('Categories is a page with site chrome', () => {
  test('desktop header Categories opens /categories with header and footer', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await gotoPath(page, '/')

    await deptNav(page).getByRole('button', { name: /Categories|Категорії/i }).click()
    await expect(page).toHaveURL(/\/categories$/)
    await expectAppShell(page)
    await expect(page.getByRole('heading', { level: 1, name: /Categories|Категорії/i })).toBeVisible()
    await expect(page.locator('.mega-menu--page')).toBeVisible()
    await expect(page.locator('.mega-menu__close')).toHaveCount(0)
    await expect(page.locator('.mega-menu__backdrop')).toHaveCount(0)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('.mega-menu__chips')).toHaveCount(0)
    await expect(page.locator('.mega-menu__chip')).toHaveCount(0)
    await expect(page.locator('.mega-menu__body')).toBeVisible()
  })

  test('mobile Categories tab opens /categories with header and footer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoPath(page, '/')

    await bottomNav(page).getByRole('button', { name: /Categories|Категор/i }).click()
    await expect(page).toHaveURL(/\/categories$/)
    await expectAppShell(page)
    await expect(page.getByRole('heading', { level: 1, name: /Categories|Категорії/i })).toBeVisible()
    await expect(page.locator('.mega-menu--page')).toBeVisible()
    await expect(page.locator('.mega-menu__close')).toHaveCount(0)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('.mega-menu__chips')).toHaveCount(0)
    await expect(page.locator('.mega-menu__body')).toBeVisible()
  })
})

test.describe('Mobile bottom nav regression', () => {
  for (const vp of MOBILE) {
    test(`tab bar visible at ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp)
      await gotoPath(page, '/')
      await expect(bottomNav(page)).toBeVisible()
      await expect(page.locator('.site-header-fixed')).toBeVisible()
      await expect(page.locator('header input[type="search"]')).toBeVisible()
      await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute(
        'content',
        'black',
      )
      const headerPad = await page.locator('.site-header-fixed').evaluate((el) => {
        const s = getComputedStyle(el)
        return { position: s.position, paddingTop: s.paddingTop, bg: s.backgroundColor }
      })
      expect(headerPad.position).toBe('fixed')
      expect(headerPad.bg.replace(/\s/g, '')).toMatch(/rgb\(35,47,62\)|#232f3e/i)
      await expect(bottomNav(page).getByRole('button', { name: /Home|Головна/i })).toBeVisible()
      await expect(bottomNav(page).getByRole('button', { name: /Search|Пошук/i })).toBeVisible()
      await expect(bottomNav(page).getByRole('button', { name: /Categories|Категор/i })).toBeVisible()
      await expect(bottomNav(page).getByRole('button', { name: /Map|Карта/i })).toBeVisible()
      await expect(bottomNav(page).getByRole('button', { name: /More|Ще/i })).toBeVisible()
      await expect(deptNav(page)).toBeHidden()
      await expectNoHorizontalOverflow(page)
    })
  }
})
