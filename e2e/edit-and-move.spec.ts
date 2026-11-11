import { expect, test, type Page } from '@playwright/test'

function openTab(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name, exact: true }).click()
}

test('a bought wishlist item moves to the closet once, even after a reload', async ({ page }) => {
  await page.goto('/')
  await openTab(page, 'Wishlist')
  const wish = page.locator('.buy-card', { hasText: 'Structured evening shoulder bag' })
  await wish.getByLabel('Status').selectOption('Bought')

  await openTab(page, 'Closet')
  const piece = page.locator('.item-card', { hasText: 'Structured evening shoulder bag' })
  await expect(piece).toHaveCount(1)

  await page.reload()
  await openTab(page, 'Wishlist')
  await page.locator('.buy-card', { hasText: 'Structured evening shoulder bag' }).getByLabel('Status').selectOption('Researching')
  await page.locator('.buy-card', { hasText: 'Structured evening shoulder bag' }).getByLabel('Status').selectOption('Bought')

  await openTab(page, 'Closet')
  await expect(page.locator('.item-card', { hasText: 'Structured evening shoulder bag' })).toHaveCount(1)
})

test('a closet piece can be edited and deleted', async ({ page }) => {
  await page.goto('/')
  await openTab(page, 'Closet')
  await page.getByLabel('Name').first().fill('Navy blazer')
  await page.getByLabel('Color').first().fill('Navy')
  await page.getByRole('button', { name: 'Add to closet' }).click()

  const card = page.locator('.item-card', { hasText: 'Navy blazer' })
  await card.getByRole('button', { name: 'Edit', exact: true }).click()
  const form = page.getByRole('form', { name: 'Edit Navy blazer' })
  await form.getByLabel('Name').fill('Navy wool blazer')
  await form.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.locator('.item-card', { hasText: 'Navy wool blazer' })).toContainText('Navy · All-season')

  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('.item-card', { hasText: 'Navy wool blazer' }).getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.locator('.item-card', { hasText: 'Navy wool blazer' })).toHaveCount(0)
})

test('a closet piece edit can be cancelled and a delete can be dismissed', async ({ page }) => {
  await page.goto('/')
  await openTab(page, 'Closet')
  const card = page.locator('.item-card', { hasText: 'Wool Coat' }).first()
  const name = (await card.locator('strong').first().textContent()) ?? ''

  await card.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByRole('form', { name: `Edit ${name}` }).getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('form', { name: `Edit ${name}` })).toHaveCount(0)

  page.once('dialog', (dialog) => dialog.dismiss())
  await page.locator('.item-card', { hasText: name }).getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.locator('.item-card', { hasText: name })).toHaveCount(1)
})

test('a wishlist item can be edited', async ({ page }) => {
  await page.goto('/')
  await openTab(page, 'Wishlist')
  const wish = page.locator('.buy-card', { hasText: 'Structured evening shoulder bag' })
  await wish.getByRole('button', { name: 'Edit', exact: true }).click()

  const form = page.getByRole('form', { name: 'Edit Structured evening shoulder bag' })
  await form.getByLabel('Brand').fill('Acme Atelier')
  await form.getByLabel('Notes').fill('Wait for a sale.')
  await form.getByRole('button', { name: 'Save changes' }).click()

  const saved = page.locator('.buy-card', { hasText: 'Structured evening shoulder bag' })
  await expect(saved).toContainText('Acme Atelier')
  await expect(saved).toContainText('Wait for a sale.')
})
