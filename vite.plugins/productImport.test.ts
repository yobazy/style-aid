import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractMeta, extractTitle, handleImport, retailerFromHostname, sanitizePrice } from './productImport'

type FakeResponse = { statusCode: number; headers: Record<string, string>; body: string }

async function callImport(url: string) {
  const res: FakeResponse = { statusCode: 200, headers: {}, body: '' }
  const serverResponse = {
    get statusCode() {
      return res.statusCode
    },
    set statusCode(value: number) {
      res.statusCode = value
    },
    setHeader: (name: string, value: string) => {
      res.headers[name.toLowerCase()] = value
    },
    end: (body?: string) => {
      res.body = body ?? ''
    },
  } as unknown as ServerResponse
  await handleImport({ url } as IncomingMessage, serverResponse)
  return res
}

function mockPage(html: string, ok = true) {
  const fetchMock = vi.fn(async () => ({ ok, text: async () => html }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('extractMeta', () => {
  it('reads property and name meta tags in either attribute order', () => {
    const html = `
      <meta property="og:title" content="Silk &amp; Wool Scarf">
      <meta content="Acme" name="brand">`

    expect(extractMeta(html, 'og:title')).toBe('Silk & Wool Scarf')
    expect(extractMeta(html, 'brand')).toBe('Acme')
    expect(extractMeta(html, 'og:image')).toBe('')
  })
})

describe('extractTitle', () => {
  it('reads the document title', () => {
    expect(extractTitle('<title> Linen Shirt </title>')).toBe('Linen Shirt')
  })
})

describe('sanitizePrice', () => {
  it('pulls a plain price out of text', () => {
    expect(sanitizePrice('$49.99')).toBe('49.99')
    expect(sanitizePrice('USD 120')).toBe('120')
    expect(sanitizePrice('none')).toBe('')
  })

  it('handles thousands separators and decimal commas', () => {
    expect(sanitizePrice('$1,299.00')).toBe('1299.00')
    expect(sanitizePrice('1,299')).toBe('1299')
    expect(sanitizePrice('49,99 €')).toBe('49.99')
    expect(sanitizePrice('1.299,00')).toBe('1299.00')
    expect(sanitizePrice('12.5')).toBe('12.5')
    expect(sanitizePrice('2,450,000')).toBe('2450000')
  })
})

describe('retailerFromHostname', () => {
  it('turns a hostname into a readable retailer name', () => {
    expect(retailerFromHostname('www.net-a-porter.com')).toBe('Net A Porter')
  })
})

describe('handleImport', () => {
  it('rejects a request with no url', async () => {
    const res = await callImport('/?')

    expect(res.statusCode).toBe(400)
    expect(res.body).toBe('Missing url parameter.')
  })

  it('returns product details from Open Graph tags', async () => {
    mockPage(`
      <meta property="og:title" content="Gold Hoop Earrings">
      <meta property="product:brand" content="Mejuri">
      <meta property="product:price:amount" content="78.00">
      <meta property="og:image" content="/img/hoops.jpg">`)

    const res = await callImport(`/?url=${encodeURIComponent('https://www.mejuri.com/p/hoops')}`)

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('application/json')
    expect(JSON.parse(res.body)).toEqual({
      title: 'Gold Hoop Earrings',
      brand: 'Mejuri',
      retailer: 'Mejuri',
      currentPrice: '78.00',
      image: 'https://www.mejuri.com/img/hoops.jpg',
      productUrl: 'https://www.mejuri.com/p/hoops',
    })
  })

  it('reports a failed fetch', async () => {
    mockPage('', false)
    const res = await callImport(`/?url=${encodeURIComponent('https://shop.example/p')}`)

    expect(res.statusCode).toBe(400)
    expect(res.body).toBe('Could not fetch shop.example.')
  })

  it('rejects a url it cannot parse', async () => {
    const res = await callImport('/?url=not-a-url')

    expect(res.statusCode).toBe(400)
    expect(res.body).toBe('Could not import this product link.')
  })
})
