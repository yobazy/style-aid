import type { IncomingMessage, ServerResponse } from 'node:http'
import { lookup } from 'node:dns/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  extractMeta,
  extractTitle,
  handleImport,
  isNonPublicAddress,
  retailerFromHostname,
  sanitizePrice,
} from './productImport'

vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }))
const lookupMock = vi.mocked(lookup) as unknown as ReturnType<typeof vi.fn>

function resolvesTo(...addresses: string[]) {
  lookupMock.mockResolvedValue(addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })))
}

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

function page(html: string, init: { ok?: boolean; status?: number; headers?: Record<string, string> } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    headers: new Headers(init.headers),
    text: async () => html,
  }
}

function mockPage(html: string, ok = true) {
  const fetchMock = vi.fn(async () => page(html, { ok, status: ok ? 200 : 404 }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  resolvesTo('93.184.216.34')
})

afterEach(() => {
  vi.unstubAllGlobals()
  lookupMock.mockReset()
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

  it.each([
    'http://localhost:11434/',
    'http://127.0.0.1:5173/',
    'http://169.254.169.254/latest/meta-data/',
    'http://192.168.1.1/',
    'http://100.66.137.24:9000/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'file:///etc/passwd',
  ])('refuses to fetch %s', async (url) => {
    const fetchMock = mockPage('<title>internal</title>')
    const res = await callImport(`/?url=${encodeURIComponent(url)}`)

    expect(res.statusCode).toBe(400)
    expect(res.body).toBe('Only public http or https product pages can be imported.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a public hostname that resolves to a private address', async () => {
    resolvesTo('10.0.0.5')
    const fetchMock = mockPage('<title>internal</title>')
    const res = await callImport(`/?url=${encodeURIComponent('https://sneaky.example/')}`)

    expect(res.statusCode).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('checks every redirect hop', async () => {
    const fetchMock = vi.fn(async () => page('', { ok: false, status: 302, headers: { location: 'http://127.0.0.1/admin' } }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await callImport(`/?url=${encodeURIComponent('https://shop.example/p')}`)

    expect(res.body).toBe('Only public http or https product pages can be imported.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('follows a redirect to another public page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(page('', { ok: false, status: 301, headers: { location: '/p/new' } }))
      .mockResolvedValueOnce(page('<meta property="og:title" content="Wool Coat">'))
    vi.stubGlobal('fetch', fetchMock)
    const res = await callImport(`/?url=${encodeURIComponent('https://shop.example/p/old')}`)

    expect(JSON.parse(res.body).title).toBe('Wool Coat')
    expect(String(fetchMock.mock.calls[1][0])).toBe('https://shop.example/p/new')
  })

  it('refuses pages that declare a huge size', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => page('', { headers: { 'content-length': String(50 * 1024 * 1024) } })))
    const res = await callImport(`/?url=${encodeURIComponent('https://shop.example/p')}`)

    expect(res.body).toBe('Could not fetch shop.example.')
  })
})

describe('handleImport with a streamed body', () => {
  it('stops reading after 5 MB when no size is declared', async () => {
    let pulls = 0
    const chunk = new TextEncoder().encode('<meta property="og:title" content="Big Page">'.padEnd(1024 * 1024, ' '))
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1
        controller.enqueue(chunk)
      },
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })))

    const res = await callImport(`/?url=${encodeURIComponent('https://shop.example/p')}`)

    expect(JSON.parse(res.body).title).toBe('Big Page')
    expect(pulls).toBeLessThanOrEqual(7)
  })
})

describe('isNonPublicAddress', () => {
  it('flags loopback, private, link-local and CGNAT ranges', () => {
    for (const address of ['127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.0.10', '169.254.1.1', '100.100.1.1', '0.0.0.0', '::1', 'fd7a:115c::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a00:5']) {
      expect(isNonPublicAddress(address), address).toBe(true)
    }
  })

  it('allows public addresses', () => {
    for (const address of ['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:4700::1111']) {
      expect(isNonPublicAddress(address), address).toBe(false)
    }
  })
})
