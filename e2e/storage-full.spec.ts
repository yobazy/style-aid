import { expect, test } from '@playwright/test'

test('a full browser storage shows a warning instead of crashing the app', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  // Simulate the quota being used up, as happens after a few full-size photos.
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    }
  })

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Closet', exact: true }).click()
  await page.getByLabel('Name').fill('Big photo coat')
  await page.getByLabel('Color').fill('Camel')
  await page.getByRole('button', { name: 'Add to closet' }).click()

  await expect(page.locator('.item-card', { hasText: 'Big photo coat' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('could not be saved')
  expect(errors).toEqual([])
})
