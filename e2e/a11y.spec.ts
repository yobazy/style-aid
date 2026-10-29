import { expect, test } from '@playwright/test'

test('the current tab and toggle selections are announced', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav.getByRole('button', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page')

  await nav.getByRole('button', { name: 'Looks', exact: true }).click()
  await expect(nav.getByRole('button', { name: 'Looks', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('button', { name: 'Home', exact: true })).not.toHaveAttribute('aria-current')

  const work = page.locator('.scenario-chip-row').getByRole('button', { name: 'Work' })
  await expect(work).toHaveAttribute('aria-pressed', 'true')

  const shirt = page.getByRole('button', { name: /White Oxford Shirt/ })
  await expect(shirt).toHaveAttribute('aria-pressed', 'false')
  await shirt.click()
  await expect(shirt).toHaveAttribute('aria-pressed', 'true')

  await nav.getByRole('button', { name: 'Wishlist', exact: true }).click()
  const travel = page.locator('.chooser-grid').getByRole('button', { name: 'Travel' })
  await expect(travel).toHaveAttribute('aria-pressed', 'false')
  await travel.click()
  await expect(travel).toHaveAttribute('aria-pressed', 'true')
})
