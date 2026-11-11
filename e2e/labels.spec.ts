import { expect, test } from '@playwright/test'

const tabNames = ['Home', 'Looks', 'Closet', 'Wishlist', 'Insights']

test('tabs and labels are sentence case, not all caps with wide spacing', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Primary' })

  for (const name of tabNames) {
    await nav.getByRole('button', { name, exact: true }).click()

    const labels = page.locator('.tab, .eyebrow, .panel-eyebrow, .swatch-label, .radar-label, .missing-piece-eyebrow')
    const styles = await labels.evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element)
        return {
          text: (element.textContent ?? '').trim(),
          transform: style.textTransform,
          spacing: (parseFloat(style.letterSpacing) || 0) / parseFloat(style.fontSize),
        }
      }),
    )

    expect(styles.length).toBeGreaterThan(0)
    for (const style of styles) {
      expect(style.transform, `"${style.text}" on ${name}`).toBe('none')
      expect(style.spacing, `"${style.text}" on ${name}`).toBeLessThan(0.05)
    }
  }
})

test('tab names are the sentence-case copy', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav.getByRole('button')).toHaveText(tabNames)
})
