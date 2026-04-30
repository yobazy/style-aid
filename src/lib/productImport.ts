import type { Category, ImportedProductData } from '../types'

const categoryMatchers: Array<{ category: Category; patterns: RegExp[] }> = [
  { category: 'Shoes', patterns: [/\bshoe\b/i, /\bsneaker\b/i, /\bloafer\b/i, /\bboot\b/i, /\bheel\b/i] },
  { category: 'Bags', patterns: [/\bbag\b/i, /\btote\b/i, /\bshoulder bag\b/i, /\bcrossbody\b/i, /\bclutch\b/i] },
  { category: 'Jewelry', patterns: [/\bearring\b/i, /\bnecklace\b/i, /\bbracelet\b/i, /\bring\b/i, /\bjewelry\b/i] },
  { category: 'Watches', patterns: [/\bwatch\b/i] },
  { category: 'Outerwear', patterns: [/\bcoat\b/i, /\bblazer\b/i, /\bjacket\b/i, /\btrench\b/i] },
  { category: 'Bottoms', patterns: [/\bjean\b/i, /\btrouser\b/i, /\bpant\b/i, /\bskirt\b/i, /\bshort\b/i] },
  { category: 'Tops', patterns: [/\bshirt\b/i, /\btee\b/i, /\btop\b/i, /\bsweater\b/i, /\bhoodie\b/i, /\bcardigan\b/i] },
  { category: 'Accessories', patterns: [/\bbelt\b/i, /\bscarf\b/i, /\bhat\b/i, /\bsunglasses\b/i, /\baccessory\b/i] },
]

function inferCategory(title: string): Category | undefined {
  for (const matcher of categoryMatchers) {
    if (matcher.patterns.some((pattern) => pattern.test(title))) {
      return matcher.category
    }
  }

  return undefined
}

export async function importProductFromUrl(url: string): Promise<ImportedProductData> {
  const response = await fetch(`/api/import-product?url=${encodeURIComponent(url)}`)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Could not import this product link.')
  }

  const imported = (await response.json()) as ImportedProductData
  const title = imported.title.trim()

  return {
    ...imported,
    title,
    category: imported.category ?? inferCategory(title),
  }
}
