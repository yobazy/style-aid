import type { WardrobeItem, WishlistItem } from '../types'

export function isBoughtWishlistItem(item: WishlistItem) {
  return item.status === 'Bought' || item.purchased
}

// Every bought wishlist item becomes one closet piece. The wishlist item keeps a link to
// the piece it created, so it is only ever moved once: deleting that piece later does not
// bring it back, and buying it again does not add a second copy.
export function moveBoughtToCloset(
  wardrobe: WardrobeItem[],
  wishlist: WishlistItem[],
  createId: () => string = () => crypto.randomUUID(),
) {
  const added: WardrobeItem[] = []

  const nextWishlist = wishlist.map((item) => {
    if (!isBoughtWishlistItem(item) || item.boughtWardrobeItemId) {
      return item
    }

    const piece: WardrobeItem = {
      id: createId(),
      name: item.title,
      category: item.category,
      color: '',
      season: item.season,
      qualityRating: 3,
      needsReplacing: false,
      dressCode: 'Casual',
      formality: 2,
      favorite: false,
      tags: [],
      image: item.image,
    }
    added.push(piece)

    return { ...item, boughtWardrobeItemId: piece.id }
  })

  return { wardrobe: [...added, ...wardrobe], wishlist: nextWishlist }
}

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
