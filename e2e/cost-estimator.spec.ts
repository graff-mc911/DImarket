import { test, expect, type Page } from '@playwright/test'
import { clickHeaderNavButton, gotoPath } from './helpers'

async function openBathroomQuote(page: Page) {
  await gotoPath(page, '/cost-estimator')
  await page.getByRole('button', { name: /Ремонт ванної кімнати|Bathroom Remodel/ }).click()
  await expect(
    page.getByRole('heading', {
      name: /Коли вам потрібно розпочати ваш проєкт\?|When do you need your project started\?/,
    }),
  ).toBeVisible()
}

async function clickContinue(page: Page) {
  await page.getByRole('button', { name: /продовжити|ПРОДОВЖУВАТИ|continue|CONTINUE|НАДІСЛАТИ|SUBMIT/i }).click()
}

test.describe('Cost estimator calculator', () => {
  test('homepage card click skips title; Back returns to the title screen', async ({ page }) => {
    await openBathroomQuote(page)
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel(/Мені потрібна допомога з|I need help with/i)).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /З чим вам потрібна допомога\?|What do you need help with\?/ }),
    ).toHaveCount(0)

    await page.locator('.bz-quote__back').click()
    await expect(
      page.getByRole('heading', { name: /З чим вам потрібна допомога\?|What do you need help with\?/ }),
    ).toBeVisible()
    await expect(page.locator('#bz-quote-title')).toHaveValue(/Ремонт ванної кімнати|Bathroom Remodel/)
    const commercial = page.getByRole('button', {
      name: /Нова комерційна реконструкція|New Commercial Remodel/,
    })
    await expect(commercial).toBeVisible()
    const tileBox = await commercial.boundingBox()
    const dialogBox = await page.getByRole('dialog').boundingBox()
    expect(tileBox, 'commercial tile box').toBeTruthy()
    expect(dialogBox, 'quote dialog box').toBeTruthy()
    expect((tileBox?.y ?? 0) + (tileBox?.height ?? 0)).toBeLessThanOrEqual(
      (dialogBox?.y ?? 0) + (dialogBox?.height ?? 0) + 2,
    )
  })

  test('empty Get quotes opens the title screen', async ({ page }) => {
    await gotoPath(page, '/cost-estimator')
    await page.getByRole('button', { name: /Отримати котирування|Get quotes/ }).click()
    await expect(
      page.getByRole('heading', { name: /З чим вам потрібна допомога\?|What do you need help with\?/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: /Коли вам потрібно розпочати ваш проєкт\?|When do you need your project started\?/,
      }),
    ).toHaveCount(0)
  })

  test('bathroom remodel: urgency → property type, not bids or land', async ({ page }) => {
    await openBathroomQuote(page)
    await expect(page.getByRole('button', { name: /Я гнучкий\/гнучка|I'm flexible/ })).toBeVisible()

    await page.getByRole('button', { name: /Протягом кількох тижнів|Within a few weeks/ }).click()

    await expect(
      page.getByRole('heading', { name: /Який це тип нерухомості\?|What type of property is this\?/ }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Приватний будинок|Single Family Home/ })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Скільки пропозицій|How many bids/ }),
    ).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /У вас вже є земля\?|Do you already have land\?/ })).toHaveCount(0)
  })

  test('new home construction: urgency → land ownership', async ({ page }) => {
    await gotoPath(page, '/cost-estimator')
    await page.getByRole('button', { name: /Будівництво нового будинку|New Home Construction/ }).click()
    await page.getByRole('button', { name: /Якомога швидше|As soon as possible/ }).click()
    await expect(page.getByRole('heading', { name: /У вас вже є земля\?|Do you already have land\?/ })).toBeVisible()
    await expect(page.locator('.bz-quote__progress-fill')).toBeVisible()
    await expect(page.getByRole('button', { name: /Закрити|Close/ })).toBeVisible()
    await expect(page.locator('.bz-quote__back')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Так$|^Yes$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /У процесі|In process/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Ні$|^No$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Так$|^Yes$/ })).not.toHaveClass(/is-active/)
    await expect(
      page.getByRole('heading', { name: /Який це тип нерухомості\?|What type of property is this\?/ }),
    ).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /Скільки пропозицій|How many bids/ })).toHaveCount(0)
  })

  test('home addition uses design status after location, not relationship', async ({ page }) => {
    test.setTimeout(90_000)
    await gotoPath(page, '/cost-estimator')
    await page.getByRole('button', { name: /Добудова до будинку|Home Addition/ }).click()
    await page.getByRole('button', { name: /Я гнучкий\/гнучка|I'm flexible/ }).click()
    await page.getByRole('button', { name: /Приватний будинок|Single Family Home/ }).click()
    await page.getByPlaceholder(/^Email$/i).fill('addition-e2e@example.com')
    await clickContinue(page)
    await page.getByPlaceholder(/Мобільний телефон|Mobile phone/).fill('+380501112233')
    await clickContinue(page)
    await page.getByPlaceholder(/Ім'я|^Name$/).fill('Test Owner')
    await clickContinue(page)
    await page.getByPlaceholder(/^Місто$|^City$/).fill('Kyiv')
    await clickContinue(page)
    await expect(
      page.getByRole('heading', { name: /Чи є у вас готові проєкти|Do you have completed designs\?/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Який ваш звʼязок|What is your relationship with this property\?/ }),
    ).toHaveCount(0)
  })

  test('remodel guest path reaches results after every BuildZoom screen', async ({ page }) => {
    test.setTimeout(90_000)
    await openBathroomQuote(page)
    await page.getByRole('button', { name: /Протягом кількох тижнів|Within a few weeks/ }).click()
    await page.getByRole('button', { name: /Приватний будинок|Single Family Home/ }).click()
    await page.getByPlaceholder(/^Email$/i).fill('bathroom-e2e@example.com')
    await clickContinue(page)
    await page.getByPlaceholder(/Мобільний телефон|Mobile phone/).fill('+380501112233')
    await clickContinue(page)
    await page.getByPlaceholder(/Ім'я|^Name$/).fill('Test Owner')
    await clickContinue(page)
    await expect(page.getByRole('heading', { name: /Де вам потрібен підрядник\?|Where do you need a contractor\?/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Скільки пропозицій|How many bids/ })).toHaveCount(0)
    await page.getByPlaceholder(/^Місто$|^City$/).fill('Kyiv')
    await clickContinue(page)
    await expect(
      page.getByRole('heading', { name: /Який ваш звʼязок|What is your relationship with this property\?/ }),
    ).toBeVisible()
    await page.getByRole('button', { name: /Я власник|I own or help manage it/ }).click()
    await expect(page.getByRole('heading', { name: /Який у вас бюджет\?|What is your budget\?/ })).toBeVisible()
    await page.locator('select.bz-quote__select').selectOption('5000-20000')
    await clickContinue(page)
    await expect(page.getByRole('heading', { name: /Коротко опишіть|Please give a brief description/ })).toBeVisible()
    await clickContinue(page)
    await expect(
      page.getByRole('heading', { name: /Створіть пароль|Create a password to easily access your matches/ }),
    ).toBeVisible()
    await page.getByPlaceholder(/^Пароль$|^Password$/).fill('secret1')
    await page.getByRole('button', { name: /НАДІСЛАТИ|SUBMIT/i }).click()
    await expect(page.getByText(/Орієнтовна оцінка|Reference estimate/i).first()).toBeVisible({
      timeout: 25_000,
    })
  })

  test('email validation blocks continue and keeps the value', async ({ page }) => {
    await openBathroomQuote(page)
    await page.getByRole('button', { name: /Протягом кількох тижнів|Within a few weeks/ }).click()
    await page.getByRole('button', { name: /Приватний будинок|Single Family Home/ }).click()
    await page.getByPlaceholder(/^Email$/i).fill('not-an-email')
    await clickContinue(page)
    await expect(page.getByText(/дійсну електронну|valid email address/i)).toBeVisible()
    await expect(page.getByPlaceholder(/^Email$/i)).toHaveValue('not-an-email')
  })

  test('low budget blocks continue', async ({ page }) => {
    test.setTimeout(60_000)
    await openBathroomQuote(page)
    await page.getByRole('button', { name: /Протягом кількох тижнів|Within a few weeks/ }).click()
    await page.getByRole('button', { name: /Приватний будинок|Single Family Home/ }).click()
    await page.getByPlaceholder(/^Email$/i).fill('lowbudget@example.com')
    await clickContinue(page)
    await page.getByPlaceholder(/Мобільний телефон|Mobile phone/).fill('+380501112233')
    await clickContinue(page)
    await page.getByPlaceholder(/Ім'я|^Name$/).fill('Test Owner')
    await clickContinue(page)
    await page.getByPlaceholder(/^Місто$|^City$/).fill('Kyiv')
    await clickContinue(page)
    await page.getByRole('button', { name: /Я орендую|I rent it/ }).click()
    await page.locator('select.bz-quote__select').selectOption('0-1000')
    await expect(page.getByText(/дешевше €1 000|under €1,000/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /продовжити|ПРОДОВЖУВАТИ|continue|CONTINUE/i })).toBeDisabled()
  })

  test('Back keeps the previous urgency answer', async ({ page }) => {
    await openBathroomQuote(page)
    await page.getByRole('button', { name: /Протягом кількох тижнів|Within a few weeks/ }).click()
    await expect(
      page.getByRole('heading', { name: /Який це тип нерухомості\?|What type of property is this\?/ }),
    ).toBeVisible()
    await page.locator('.bz-quote__back').click()
    await expect(
      page.getByRole('heading', {
        name: /Коли вам потрібно розпочати ваш проєкт\?|When do you need your project started\?/,
      }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Протягом кількох тижнів|Within a few weeks/ })).toHaveClass(
      /is-active/,
    )
  })

  test('refresh restores the current quote screen', async ({ page }) => {
    await openBathroomQuote(page)
    await page.getByRole('button', { name: /Протягом кількох тижнів|Within a few weeks/ }).click()
    await expect(
      page.getByRole('heading', { name: /Який це тип нерухомості\?|What type of property is this\?/ }),
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('heading', { name: /Який це тип нерухомості\?|What type of property is this\?/ }),
    ).toBeVisible()
  })

  test('клік «Калькулятор вартості» — SPA без циклу перезавантаження', async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 1280) < 1024, 'Dept-nav click is desktop Chrome')

    await gotoPath(page, '/')

    let loads = 0
    page.on('load', () => {
      loads += 1
    })

    await clickHeaderNavButton(page, /Cost estimator|Калькулятор вартості/i, viewport)
    await expect(page).toHaveURL(/\/cost-estimator/)
    await expect(page.getByLabel(/Мені потрібна допомога з|I need help with/i)).toBeVisible()

    await page.waitForTimeout(2500)
    expect(loads, 'Chrome reload loop on cost estimator').toBe(0)
    await expect(page).toHaveURL(/\/cost-estimator/)
  })
})
