import { expect, test } from '@playwright/test'

test('a large photo is shrunk to about 800 px before it is saved', async ({ page }) => {
  await page.goto('/')
  const bigPhoto = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 3000
    canvas.height = 2000
    const context = canvas.getContext('2d')!
    context.fillStyle = '#3366cc'
    context.fillRect(0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  })

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Closet', exact: true }).click()
  await page.getByLabel('Photo').setInputFiles({
    name: 'big.png',
    mimeType: 'image/png',
    buffer: Buffer.from(bigPhoto.split(',')[1], 'base64'),
  })
  await expect(page.getByAltText('Piece preview')).toBeVisible()
  await page.getByLabel('Name').fill('Big photo blazer')
  await page.getByLabel('Color').fill('Blue')
  await page.getByRole('button', { name: 'Add to closet' }).click()
  await expect(page.locator('.item-card', { hasText: 'Big photo blazer' })).toBeVisible()

  const saved = await page.evaluate(async () => {
    const state = JSON.parse(localStorage.getItem('style-aid-state-v2') ?? '{}')
    const item = state.wardrobe.find((entry: { name: string }) => entry.name === 'Big photo blazer')
    const image = new Image()
    image.src = item.image
    await image.decode()
    return { prefix: item.image.slice(0, 15), width: image.naturalWidth, height: image.naturalHeight }
  })

  expect(saved.prefix).toBe('data:image/jpeg')
  expect(saved.width).toBe(800)
  expect(saved.height).toBe(533)
})
