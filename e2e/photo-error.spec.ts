import { expect, test } from '@playwright/test'

test('a photo that cannot be read shows a message instead of failing silently', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await page.evaluate(() => {
    FileReader.prototype.readAsDataURL = function () {
      setTimeout(() => this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>))
    }
  })
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Closet', exact: true }).click()
  await page.getByLabel('Photo').setInputFiles({ name: 'coat.png', mimeType: 'image/png', buffer: Buffer.from('not really a png') })

  await expect(page.getByText('That photo could not be read. Try another file.')).toBeVisible()
  expect(errors).toEqual([])
})
