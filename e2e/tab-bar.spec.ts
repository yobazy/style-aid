import { expect, test } from '@playwright/test'

test.describe('phone tab bar', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone layout only')

  test('the tabs sit in one horizontally scrolling row', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Primary' })
    const tabs = nav.getByRole('button')
    await expect(tabs).toHaveCount(5)

    const tops = await tabs.evaluateAll((elements) =>
      elements.map((element) => Math.round(element.getBoundingClientRect().top)),
    )
    expect(new Set(tops).size).toBe(1)

    const navBox = await nav.boundingBox()
    expect(navBox?.height).toBeLessThan(70)
    expect(await nav.evaluate((element) => getComputedStyle(element).overflowX)).toBe('auto')
  })

  test('the active tab is scrolled into view', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Primary' })
    const insights = nav.getByRole('button', { name: 'Insights', exact: true })

    await insights.click()
    await expect(insights).toHaveAttribute('aria-current', 'page')

    const navBox = await nav.boundingBox()
    const tabBox = await insights.boundingBox()
    expect(tabBox).not.toBeNull()
    expect(navBox).not.toBeNull()
    expect(tabBox!.x).toBeGreaterThanOrEqual(navBox!.x - 1)
    expect(tabBox!.x + tabBox!.width).toBeLessThanOrEqual(navBox!.x + navBox!.width + 1)
  })
})
