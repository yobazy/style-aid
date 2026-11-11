import { expect, test, type Page } from '@playwright/test'

function openTab(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name, exact: true }).click()
}

async function buildLook(page: Page, name: string, pieces: string[]) {
  await openTab(page, 'Looks')
  await page.getByLabel('Look name').fill(name)
  for (const piece of pieces) {
    await page.locator('.select-card', { hasText: piece }).click()
  }
  await page.getByRole('button', { name: 'Save look' }).click()
  return page.locator('.look-board-card', { hasText: name })
}

test('a complete look is Ready, and the rule is explained', async ({ page }) => {
  await page.goto('/')
  const saved = await buildLook(page, 'Client lunch', [
    'White Oxford Shirt',
    'Tailored Trousers',
    'Black Slingbacks',
    'Crossbody Bag',
  ])

  await expect(saved.getByText('Ready', { exact: true })).toBeVisible()
  await expect(saved).toContainText('Nothing is missing.')
  await expect(page.getByText('Status follows the pieces.')).toBeVisible()
  await expect(page.getByLabel('Status')).toHaveCount(0)
})

test('a look with a missing piece and no wishlist idea needs one more piece', async ({ page }) => {
  await page.goto('/')
  const saved = await buildLook(page, 'Quick errand', ['White Oxford Shirt'])

  await expect(saved.getByText('Needs One More Piece', { exact: true })).toBeVisible()
  await expect(saved).toContainText('Still needs a closet piece or a wishlist item for')
})

test('a look whose only missing piece has a linked wishlist idea is Wishlist-Backed', async ({ page }) => {
  await page.goto('/')
  const saved = await buildLook(page, 'Lunch plan', [
    'White Oxford Shirt',
    'Tailored Trousers',
    'Black Slingbacks',
  ])
  await expect(saved.getByText('Needs One More Piece', { exact: true })).toBeVisible()

  await saved.getByRole('button', { name: 'bag', exact: true }).click()
  await openTab(page, 'Looks')

  const card = page.locator('.look-board-card', { hasText: 'Lunch plan' })
  await expect(card.getByText('Wishlist-Backed', { exact: true })).toBeVisible()
  await expect(card).toContainText('each one has a wishlist item linked to this look')
})
