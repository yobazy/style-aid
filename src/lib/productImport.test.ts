import { afterEach, describe, expect, it, vi } from 'vitest'
import { importProductFromUrl, inferCategory } from './productImport'

function mockFetch(body: unknown, init: { ok?: boolean; text?: string } = {}) {
  const fetchMock = vi.fn(async () => ({
    ok: init.ok ?? true,
    json: async () => body,
    text: async () => init.text ?? '',
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('inferCategory', () => {
  it.each([
    ['White Leather Sneakers', 'Shoes'],
    ['Suede Ankle Boots', 'Shoes'],
    ['Straight Leg Jeans', 'Bottoms'],
    ['Wide Trousers', 'Bottoms'],
    ['Denim Shorts', 'Bottoms'],
    ['Short Sleeve Oxford Shirt', 'Tops'],
    ['Gold Hoop Earrings', 'Jewelry'],
    ['Stacking Rings', 'Jewelry'],
    ['Cashmere Scarves', 'Accessories'],
    ['Mini Leather Tote Bag', 'Bags'],
    ['Diver Watches', 'Watches'],
  ])('puts "%s" in %s', (title, category) => {
    expect(inferCategory(title)).toBe(category)
  })
})

describe('importProductFromUrl', () => {
  it('calls the import endpoint with the encoded url', async () => {
    const fetchMock = mockFetch({ title: 'Leather tote', brand: '', retailer: 'Shop', currentPrice: '', productUrl: 'x' })
    await importProductFromUrl('https://shop.example/p?id=1&c=2')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/import-product?url=https%3A%2F%2Fshop.example%2Fp%3Fid%3D1%26c%3D2',
    )
  })

  it('trims the title and guesses the category from it', async () => {
    mockFetch({ title: '  Leather Tote Bag ', brand: '', retailer: 'Shop', currentPrice: '', productUrl: 'x' })
    const imported = await importProductFromUrl('https://shop.example/p')

    expect(imported.title).toBe('Leather Tote Bag')
    expect(imported.category).toBe('Bags')
  })

  it('leaves the category empty when nothing matches', async () => {
    mockFetch({ title: 'Gift card', brand: '', retailer: 'Shop', currentPrice: '', productUrl: 'x' })

    expect((await importProductFromUrl('https://shop.example/p')).category).toBeUndefined()
  })

  it('throws the server message when the import fails', async () => {
    mockFetch(null, { ok: false, text: 'Could not fetch shop.example.' })

    await expect(importProductFromUrl('https://shop.example/p')).rejects.toThrow('Could not fetch shop.example.')
  })
})
