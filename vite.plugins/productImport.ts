import type { IncomingMessage, ServerResponse } from 'node:http'
import { URL } from 'node:url'

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

export function sanitizePrice(value: string) {
  const match = value.match(/[0-9]+(?:[.,][0-9]{2})?/)
  return match ? match[0].replace(',', '') : ''
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
    const response = await fetch(pageUrl, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      res.statusCode = 400
      res.end(`Could not fetch ${pageUrl.hostname}.`)
      return
    }

    const html = await response.text()
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
  } catch {
    res.statusCode = 400
    res.end('Could not import this product link.')
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
