import { lookup } from 'node:dns/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { isIP } from 'node:net'
import { URL } from 'node:url'

const fetchTimeoutMs = 8000
const maxRedirects = 3
const maxPageBytes = 5 * 1024 * 1024

class BlockedUrlError extends Error {}

function ipv4ToNumber(address: string) {
  return address.split('.').reduce((value, part) => value * 256 + Number(part), 0)
}

function inIpv4Range(address: string, base: string, bits: number) {
  const size = 2 ** (32 - bits)
  return Math.floor(ipv4ToNumber(address) / size) === Math.floor(ipv4ToNumber(base) / size)
}

// Loopback, private, link-local, carrier-grade NAT (Tailscale) and other non-public ranges.
export function isNonPublicAddress(address: string) {
  // IPv4-mapped IPv6, in dotted ("::ffff:127.0.0.1") or hex ("::ffff:7f00:1") form.
  const lower = address.toLowerCase()
  const dotted = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  const hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  const ip = dotted
    ? dotted[1]
    : hex
      ? [hex[1], hex[2]]
          .map((group) => parseInt(group, 16))
          .flatMap((value) => [value >> 8, value & 255])
          .join('.')
      : lower

  if (isIP(ip) === 4) {
    return [
      ['0.0.0.0', 8],
      ['10.0.0.0', 8],
      ['100.64.0.0', 10],
      ['127.0.0.0', 8],
      ['169.254.0.0', 16],
      ['172.16.0.0', 12],
      ['192.168.0.0', 16],
      ['198.18.0.0', 15],
      ['224.0.0.0', 4],
      ['240.0.0.0', 4],
    ].some(([base, bits]) => inIpv4Range(ip, base as string, bits as number))
  }

  if (isIP(ip) === 6) {
    return ip === '::' || ip === '::1' || /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip) || ip.startsWith('ff')
  }

  return true
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BlockedUrlError()
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new BlockedUrlError()
  }

  const addresses = isIP(hostname)
    ? [hostname]
    : (await lookup(hostname, { all: true })).map((entry) => entry.address)

  if (addresses.length === 0 || addresses.some(isNonPublicAddress)) {
    throw new BlockedUrlError()
  }
}

// Reads at most maxPageBytes, so a page without a Content-Length cannot exhaust memory.
async function readLimitedText(response: Response) {
  if (!response.body) {
    return (await response.text()).slice(0, maxPageBytes)
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (total < maxPageBytes) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    chunks.push(value)
    total += value.byteLength
  }
  await reader.cancel().catch(() => undefined)

  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, maxPageBytes))
}

// Follows redirects by hand so every hop is checked, not just the first URL.
async function fetchPublicPage(url: URL, init: RequestInit, redirects = 0): Promise<Response> {
  await assertPublicUrl(url)
  const response = await fetch(url, {
    ...init,
    redirect: 'manual',
    signal: AbortSignal.timeout(fetchTimeoutMs),
  })
  const location = response.headers?.get('location')

  if (response.status >= 300 && response.status < 400 && location) {
    if (redirects >= maxRedirects) {
      throw new Error('Too many redirects')
    }
    return fetchPublicPage(new URL(location, url), init, redirects + 1)
  }

  return response
}

export function extractMeta(html: string, property: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["'][^>]*>`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return decodeHtml(match[1])
    }
  }

  return ''
}

export function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1] ? decodeHtml(match[1]) : ''
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

// Reads "1,299.00", "1.299,00", "49,99" and "$120". One or two digits after the last
// separator are decimals; three are a thousands group.
export function sanitizePrice(value: string) {
  const match = value.match(/[0-9][0-9.,]*/)
  if (!match) {
    return ''
  }

  const number = match[0].replace(/[.,]+$/, '')
  const lastSeparator = Math.max(number.lastIndexOf('.'), number.lastIndexOf(','))
  const decimals = lastSeparator === -1 ? '' : number.slice(lastSeparator + 1)

  if (decimals.length === 1 || decimals.length === 2) {
    return `${number.slice(0, lastSeparator).replace(/[.,]/g, '')}.${decimals}`
  }

  return number.replace(/[.,]/g, '')
}

export function retailerFromHostname(hostname: string) {
  const parts = hostname.replace(/^www\./, '').split('.')
  return parts[0]
    ? parts[0]
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : ''
}

function absoluteUrl(value: string, baseUrl: string) {
  if (!value) {
    return ''
  }

  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return value
  }
}

export async function handleImport(req: IncomingMessage, res: ServerResponse) {
  try {
    const requestUrl = new URL(req.url ?? '', 'http://localhost')
    const source = requestUrl.searchParams.get('url')

    if (!source) {
      res.statusCode = 400
      res.end('Missing url parameter.')
      return
    }

    const pageUrl = new URL(source)
    const response = await fetchPublicPage(pageUrl, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
      },
    })

    const declaredSize = Number(response.headers?.get('content-length') ?? 0)
    if (!response.ok || declaredSize > maxPageBytes) {
      res.statusCode = 400
      res.end(`Could not fetch ${pageUrl.hostname}.`)
      return
    }

    const html = await readLimitedText(response)
    const title =
      extractMeta(html, 'og:title') ||
      extractMeta(html, 'twitter:title') ||
      extractTitle(html)
    const brand =
      extractMeta(html, 'product:brand') ||
      extractMeta(html, 'og:brand') ||
      extractMeta(html, 'brand')
    const price =
      sanitizePrice(extractMeta(html, 'product:price:amount')) ||
      sanitizePrice(extractMeta(html, 'og:price:amount')) ||
      sanitizePrice(extractMeta(html, 'twitter:data1')) ||
      sanitizePrice(extractMeta(html, 'price'))
    const image = absoluteUrl(
      extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image'),
      pageUrl.toString(),
    )

    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        title: title || retailerFromHostname(pageUrl.hostname),
        brand,
        retailer: retailerFromHostname(pageUrl.hostname),
        currentPrice: price,
        image,
        productUrl: pageUrl.toString(),
      }),
    )
  } catch (error) {
    res.statusCode = 400
    res.end(
      error instanceof BlockedUrlError
        ? 'Only public http or https product pages can be imported.'
        : 'Could not import this product link.',
    )
  }
}

type MiddlewareServer = {
  middlewares: {
    use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void
  }
}

export function productImportPlugin() {
  return {
    name: 'product-import-plugin',
    configureServer(server: MiddlewareServer) {
      server.middlewares.use('/api/import-product', handleImport)
    },
    configurePreviewServer(server: MiddlewareServer) {
      server.middlewares.use('/api/import-product', handleImport)
    },
  }
}
