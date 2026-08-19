import { expect, type Page } from '@playwright/test'

/** Стабільний знак шапки (у header два SVG — mobile/desktop). */
export const LOGO = { role: 'img' as const, name: 'DImarket logo' }

export function headerLogo(page: Page) {
  return page.locator('header').getByRole(LOGO.role, { name: LOGO.name }).first()
}

/** Заголовок hero на головній (UA або EN — premium home). */
export const HOME_HERO = /Будуйте з перевіреними|Build with trusted professionals/i

export async function expectAppShell(page: Page) {
  await expect(headerLogo(page)).toBeVisible()
  // Site chrome footer (Home may also render an inner <footer> in content)
  await expect(page.locator('footer.premium-footer')).toBeVisible()
}

export async function clickHeaderLogo(page: Page) {
  await page
    .locator('header button:has([aria-label="DImarket logo"])')
    .first()
    .click()
}

/** Нижній ряд пунктів шапки (Категорії · Виробники · Калькулятор вартості · …). */
export function headerDeptNav(page: Page) {
  return page.locator('header nav.amazon-dept-scroll')
}

/** Основна навігація в шапці (не footer / hero). Видна лише на lg+ (≥1024px). */
export function headerNav(page: Page) {
  return headerDeptNav(page)
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
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\?.*)?$`))
  await expectAppShell(page)
}

/** Немає горизонтального скролу (layout не «поплив»). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth - doc.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(2)
}

export function mainContent(page: Page) {
  return page.locator('main').first()
}

/** Сторінки з боковими рейками — grid у main; без рейок — layout-page-gutter. */
export async function expectMainLayout(
  page: Page,
  mode: 'side-rails' | 'gutter-only',
) {
  const main = mainContent(page)
  if (mode === 'side-rails') {
    await expect(main.locator('.layout-with-side-ads')).toBeVisible()
  } else {
    await expect(main.locator('.layout-page-gutter')).toBeVisible()
  }
}

/** На широкому десктопі (≥1280px) — 3 колонки, контент у центральній (2). */
export async function expectMainInCenterGridColumn(page: Page) {
  const grid = page.locator('main .layout-with-side-ads').first()
  await expect(grid).toBeVisible()
  await expect
    .poll(async () =>
      grid.evaluate((el) => {
        const main = el.querySelector('.layout-with-side-ads__main')
        if (!main) return null
        const cols = getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length
        const mainCol = getComputedStyle(main).gridColumnStart
        const rails = el.querySelectorAll('.ad-side-rail').length
        return { cols, mainCol, rails }
      }),
    )
    .toEqual({ cols: 3, mainCol: '2', rails: 2 })
}

/** Планшет / телефон: одна колонка, бокові рейки приховані. */
export async function expectTabletSingleColumnLayout(page: Page) {
  const state = await page.locator('main .layout-with-side-ads').evaluate((grid) => {
    const main = grid.querySelector('.layout-with-side-ads__main')
    if (!main) return null
    const cols = getComputedStyle(grid).gridTemplateColumns
    const mainCol = getComputedStyle(main).gridColumnStart
    const rail = grid.querySelector('.ad-side-rail') as HTMLElement | null
    const railDisplay = rail ? getComputedStyle(rail).display : 'none'
    return { cols, mainCol, railDisplay }
  })
  expect(state).not.toBeNull()
  expect(state!.mainCol).toBe('1')
  expect(state!.cols.trim().split(/\s+/).length).toBe(1)
  expect(state!.railDisplay).toBe('none')
}

export async function fetchSampleEntityIds(request: import('@playwright/test').APIRequestContext) {
  const base = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!base || !key) {
    return { listingId: null as string | null, profileId: null as string | null }
  }

  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  const [listingRes, profileRes] = await Promise.all([
    request.get(`${base}/rest/v1/listings?status=eq.active&select=id&limit=1`, { headers }),
    request.get(`${base}/rest/v1/profiles?is_professional=eq.true&select=id&limit=1`, { headers }),
  ])

  const listingJson = listingRes.ok() ? ((await listingRes.json()) as { id: string }[]) : []
  const profileJson = profileRes.ok() ? ((await profileRes.json()) as { id: string }[]) : []

  return {
    listingId: listingJson[0]?.id ?? null,
    profileId: profileJson[0]?.id ?? null,
  }
}
