import type { WishlistItem } from '../types'

function preferFilled(incoming: string | undefined, existing: string | undefined) {
  return incoming?.trim() ? incoming : existing
}

function union(left: string[], right: string[]) {
  return [...new Set([...left, ...right])]
}

// Folds a re-added entry into the one already on the wishlist. Details the user filled in
// are never wiped by blanks, and the existing entry keeps its identity, progress and
// replacement link.
export function mergeWishlistEntry(existing: WishlistItem, incoming: WishlistItem): WishlistItem {
  return {
    ...existing,
    title: preferFilled(incoming.title, existing.title) ?? existing.title,
    image: preferFilled(incoming.image, existing.image),
    brand: preferFilled(incoming.brand, existing.brand) ?? '',
    retailer: preferFilled(incoming.retailer, existing.retailer) ?? '',
    productUrl: preferFilled(incoming.productUrl, existing.productUrl) ?? '',
    targetPrice: preferFilled(incoming.targetPrice, existing.targetPrice) ?? '',
    currentPrice: preferFilled(incoming.currentPrice, existing.currentPrice) ?? '',
    notes: preferFilled(incoming.notes, existing.notes) ?? '',
    scenarioIds: union(existing.scenarioIds, incoming.scenarioIds),
    intendedLookIds: union(existing.intendedLookIds, incoming.intendedLookIds),
    intendedWithItemIds: union(existing.intendedWithItemIds, incoming.intendedWithItemIds),
  }
}

export function findMergeTarget(wishlist: WishlistItem[], item: WishlistItem) {
  return wishlist.find(
    (entry) =>
      entry.title.toLowerCase() === item.title.toLowerCase() &&
      entry.category === item.category &&
      entry.status !== 'Bought',
  )
}
