import { expect, test, type Page } from '@playwright/test'

function openTab(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name, exact: true }).click()
}

function statValue(page: Page, label: string) {
  return page.locator('.stat-card', { hasText: label }).locator('strong')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('home shows the seed closet, looks and wishlist spend', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Build fits around real scenarios')
  await expect(statValue(page, 'Closet pieces')).toHaveText('11')
  await expect(statValue(page, 'Saved looks')).toHaveText('3')
  await expect(statValue(page, 'Wishlist spend')).toHaveText('$595')
})

test('adding a closet piece shows it in the closet and survives a reload', async ({ page }) => {
  await openTab(page, 'Closet')
  await page.getByLabel('Name').fill('Navy Blazer')
  await page.getByLabel('Category').first().selectOption('Outerwear')
  await page.getByLabel('Color').fill('Navy')
  await page.getByRole('button', { name: 'Add to closet' }).click()

  const card = page.locator('.item-card', { hasText: 'Navy Blazer' })
  await expect(card).toBeVisible()
  await expect(card).toContainText('Outerwear · Navy · All-season')

  await page.reload()
  await expect(statValue(page, 'Closet pieces')).toHaveText('12')
  await openTab(page, 'Closet')
  await expect(page.locator('.item-card', { hasText: 'Navy Blazer' })).toBeVisible()
})

test('marking a piece to replace adds a replacement to the wishlist', async ({ page }) => {
  await openTab(page, 'Closet')
  await page
    .locator('.item-card', { hasText: 'White Sneakers' })
    .getByRole('button', { name: 'Mark to replace' })
    .click()

  await openTab(page, 'Wishlist')
  const entry = page.locator('.buy-card', { hasText: 'Replace White Sneakers' })
  await expect(entry).toBeVisible()
  await expect(entry.locator('.pill-warn')).toHaveText('Replacement')
})

test('building a look tracks completeness and saves it', async ({ page }) => {
  await openTab(page, 'Looks')
  await page.getByLabel('Look name').fill('Client lunch')

  const status = page.locator('.panel-subheader span').first()
  await expect(status).toHaveText('0% complete · missing 4')

  for (const name of ['White Oxford Shirt', 'Tailored Trousers', 'Black Slingbacks']) {
    await page.locator('.select-card', { hasText: name }).click()
  }
  await expect(status).toHaveText('75% complete · missing 1')
  await expect(page.locator('.missing-piece-card')).toContainText('bag')

  await page.locator('.select-card', { hasText: 'Crossbody Bag' }).click()
  await expect(status).toHaveText('100% complete · ready to wear')

  await page.getByRole('button', { name: 'Save look' }).click()
  const saved = page.locator('.look-board-card', { hasText: 'Client lunch' })
  await expect(saved).toContainText('100% complete')
  await expect(page.getByLabel('Look name')).toHaveValue('')

  await openTab(page, 'Home')
  await expect(statValue(page, 'Saved looks')).toHaveText('4')
})

test('pieces hidden by a scenario switch do not count toward or save into the look', async ({ page }) => {
  await openTab(page, 'Looks')
  await page.getByLabel('Look name').fill('Saturday')
  await page.locator('.select-card', { hasText: 'White Oxford Shirt' }).click()

  // Weekend does not allow Business Casual, so the shirt drops out of the picker.
  await page.locator('.scenario-chip-row').getByRole('button', { name: 'Weekend' }).click()
  await expect(page.locator('.select-card', { hasText: 'White Oxford Shirt' })).toHaveCount(0)
  await expect(page.locator('.panel-subheader span').first()).toHaveText('0% complete · missing 3')

  await page.locator('.select-card', { hasText: 'Black Tee' }).click()
  await page.getByRole('button', { name: 'Save look' }).click()

  const saved = page.locator('.look-board-card', { hasText: 'Saturday' })
  await expect(saved.locator('.look-piece-pill')).toHaveText([/Black Tee/])
})

test('a missing piece on a saved look becomes a wishlist idea linked to that look', async ({ page }) => {
  await openTab(page, 'Looks')
  await page
    .locator('.look-board-card', { hasText: 'Date Night Base' })
    .getByRole('button', { name: 'accessory' })
    .click()

  const entry = page.locator('.buy-card', { hasText: 'Date Night accessory' })
  await expect(entry).toBeVisible()
  await expect(entry).toContainText('Date Night Base')
  await expect(entry).toContainText('Unlocks 1 look')
})

test('adding and removing a wishlist product updates the spend', async ({ page }) => {
  await openTab(page, 'Wishlist')
  await page.getByLabel('Item').fill('Silk scarf')
  await page.getByLabel('Target price').fill('100')
  await page.getByRole('button', { name: 'Add to wishlist' }).click()

  const entry = page.locator('.buy-card', { hasText: 'Silk scarf' })
  await expect(entry).toContainText('Est. spend $100')

  await openTab(page, 'Home')
  await expect(statValue(page, 'Wishlist spend')).toHaveText('$695')

  await openTab(page, 'Wishlist')
  await page.locator('.buy-card', { hasText: 'Silk scarf' }).getByRole('button', { name: 'Remove' }).click()
  await expect(page.locator('.buy-card', { hasText: 'Silk scarf' })).toHaveCount(0)
})

test('prices typed with a currency symbol or comma still show a spend', async ({ page }) => {
  await openTab(page, 'Wishlist')
  const entry = page.locator('.buy-card', { hasText: 'Structured evening shoulder bag' })
  await entry.getByPlaceholder('Current price').fill('$1,295')

  await expect(entry).toContainText('Est. spend $1,295')
  await expect(page.getByText('$NaN')).toHaveCount(0)
})

test('marking a wishlist item bought drops it from the spend', async ({ page }) => {
  await openTab(page, 'Wishlist')
  await page
    .locator('.buy-card', { hasText: 'Structured evening shoulder bag' })
    .getByLabel('Status')
    .selectOption('Bought')

  await openTab(page, 'Home')
  await expect(statValue(page, 'Wishlist spend')).toHaveText('$300')
})

test('insights lists gaps and turns one into a wishlist idea', async ({ page }) => {
  await openTab(page, 'Insights')
  await expect(page.getByRole('img', { name: 'Scenario coverage radar chart' })).toBeVisible()

  const gap = page.locator('.list-card', { hasText: 'would unblock Date Night Base' })
  await expect(gap).toContainText('Score 3')
  await gap.getByRole('button', { name: 'Add to wishlist' }).click()

  await expect(page.locator('.buy-card', { hasText: 'Date Night accessory' })).toBeVisible()
})

test('adding the same gap twice keeps the details already filled in', async ({ page }) => {
  await openTab(page, 'Insights')
  await page
    .locator('.list-card', { hasText: 'would unblock Date Night Base' })
    .getByRole('button', { name: 'Add to wishlist' })
    .click()

  const entry = page.locator('.buy-card', { hasText: 'Date Night accessory' })
  await entry.getByPlaceholder('Current price').fill('85')
  await entry.getByLabel('Status').selectOption('Ready to Buy')

  await openTab(page, 'Insights')
  await page
    .locator('.list-card', { hasText: 'would unblock Date Night Base' })
    .getByRole('button', { name: 'Add to wishlist' })
    .click()

  await expect(page.locator('.buy-card', { hasText: 'Date Night accessory' })).toHaveCount(1)
  await expect(entry.getByPlaceholder('Current price')).toHaveValue('85')
  await expect(entry.getByLabel('Status')).toHaveValue('Ready to Buy')
})

test('every tab renders without page errors or sideways scrolling', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  for (const tab of ['Home', 'Looks', 'Closet', 'Wishlist', 'Insights']) {
    await openTab(page, tab)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, `${tab} overflows sideways`).toBeLessThanOrEqual(0)
  }

  expect(errors).toEqual([])
})
