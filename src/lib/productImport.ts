import type { Category, ImportedProductData } from '../types'

// Product titles are usually plural ("Ankle Boots"), so each word allows its plural.
// "Short" alone is left out so "Short Sleeve Shirt" stays a top.
const categoryMatchers: Array<{ category: Category; patterns: RegExp[] }> = [
  { category: 'Shoes', patterns: [/\bshoes?\b/i, /\bsneakers?\b/i, /\bloafers?\b/i, /\bboots?\b/i, /\bheels?\b/i] },
  { category: 'Bags', patterns: [/\bbags?\b/i, /\btotes?\b/i, /\bcrossbody\b/i, /\bclutch(es)?\b/i] },
  { category: 'Jewelry', patterns: [/\bearrings?\b/i, /\bnecklaces?\b/i, /\bbracelets?\b/i, /\brings?\b/i, /\bjewelry\b/i] },
  { category: 'Watches', patterns: [/\bwatch(es)?\b/i] },
  { category: 'Outerwear', patterns: [/\bcoats?\b/i, /\bblazers?\b/i, /\bjackets?\b/i, /\btrench\b/i] },
  { category: 'Bottoms', patterns: [/\bjeans?\b/i, /\btrousers?\b/i, /\bpants?\b/i, /\bskirts?\b/i, /\bshorts\b/i] },
  { category: 'Tops', patterns: [/\bshirts?\b/i, /\btees?\b/i, /\btops?\b/i, /\bsweaters?\b/i, /\bhoodies?\b/i, /\bcardigans?\b/i] },
  { category: 'Accessories', patterns: [/\bbelts?\b/i, /\bscarf\b/i, /\bscarves\b/i, /\bhats?\b/i, /\bsunglasses\b/i, /\baccessory\b/i, /\baccessories\b/i] },
]

export function inferCategory(title: string): Category | undefined {
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
