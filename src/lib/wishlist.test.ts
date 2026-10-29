import { describe, expect, it } from 'vitest'
import type { WishlistItem } from '../types'
import { findMergeTarget, mergeWishlistEntry } from './wishlist'

function wish(overrides: Partial<WishlistItem> & Pick<WishlistItem, 'id'>): WishlistItem {
  return {
    title: 'Date Night accessory',
    category: 'Accessories',
    season: 'All-season',
    brand: '',
    retailer: '',
    productUrl: '',
    targetPrice: '',
    currentPrice: '',
    priority: 'Medium',
    status: 'Researching',
    notes: '',
    scenarioIds: [],
    intendedWithItemIds: [],
    intendedLookIds: [],
    isReplacement: false,
    purchased: false,
    ...overrides,
  }
}

describe('mergeWishlistEntry', () => {
  const existing = wish({
    id: 'existing',
    brand: 'Khaite',
    retailer: 'Ssense',
    productUrl: 'https://shop.example/belt',
    targetPrice: '200',
    currentPrice: '240',
    notes: 'Thin black belt',
    priority: 'High',
    status: 'Ready to Buy',
    scenarioIds: ['date-night'],
    intendedLookIds: ['look-a'],
  })

  it('keeps filled-in details when the incoming entry is blank', () => {
    const merged = mergeWishlistEntry(
      existing,
      wish({ id: 'new', priority: 'Medium', status: 'Researching', intendedLookIds: ['look-b'] }),
    )

    expect(merged).toMatchObject({
      id: 'existing',
      brand: 'Khaite',
      retailer: 'Ssense',
      productUrl: 'https://shop.example/belt',
      targetPrice: '200',
      currentPrice: '240',
      notes: 'Thin black belt',
      priority: 'High',
      status: 'Ready to Buy',
    })
    expect(merged.intendedLookIds).toEqual(['look-a', 'look-b'])
  })

  it('takes newly filled-in details from the incoming entry', () => {
    const merged = mergeWishlistEntry(existing, wish({ id: 'new', currentPrice: '199', image: 'https://img.example/belt.jpg' }))

    expect(merged.currentPrice).toBe('199')
    expect(merged.image).toBe('https://img.example/belt.jpg')
    expect(merged.targetPrice).toBe('200')
  })

  it('keeps a replacement entry linked to its closet piece', () => {
    const replacement = wish({ id: 'r', isReplacement: true, linkedWardrobeItemId: 'item-coat' })
    const merged = mergeWishlistEntry(replacement, wish({ id: 'new' }))

    expect(merged).toMatchObject({ id: 'r', isReplacement: true, linkedWardrobeItemId: 'item-coat' })
  })
})

describe('findMergeTarget', () => {
  it('matches title case-insensitively within the same category, skipping bought items', () => {
    const list = [
      wish({ id: 'bought', status: 'Bought' }),
      wish({ id: 'other-category', category: 'Bags' }),
      wish({ id: 'match' }),
    ]

    expect(findMergeTarget(list, wish({ id: 'x', title: 'date night ACCESSORY' }))?.id).toBe('match')
    expect(findMergeTarget(list, wish({ id: 'x', title: 'Something else' }))).toBeUndefined()
  })
})
