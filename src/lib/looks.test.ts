import { describe, expect, it } from 'vitest'
import { scenarioPresets } from '../data/scenarios'
import type { Look, Scenario, WardrobeItem, WishlistItem } from '../types'
import {
  describeLookStatus,
  getLookSummary,
  getUseCountByItem,
  itemMatchesLookFilters,
  itemMatchesSeason,
  singularCategory,
} from './looks'

function piece(overrides: Partial<WardrobeItem> & Pick<WardrobeItem, 'id' | 'category'>): WardrobeItem {
  return {
    name: overrides.id,
    color: 'Black',
    season: 'All-season',
    qualityRating: 4,
    needsReplacing: false,
    dressCode: 'Business Casual',
    formality: 3,
    favorite: false,
    tags: [],
    ...overrides,
  }
}

function look(overrides: Partial<Look> = {}): Look {
  return {
    id: 'look-1',
    name: 'Test look',
    scenarioId: 'work',
    season: 'All-season',
    notes: '',
    itemIds: [],
    isPlanned: false,
    rating: 4,
    status: 'Ready',
    missingCategories: [],
    wishlistItemIds: [],
    ...overrides,
  }
}

const work = scenarioPresets.find((scenario) => scenario.id === 'work') as Scenario
const wardrobe = [
  piece({ id: 'top', category: 'Tops' }),
  piece({ id: 'bottom', category: 'Bottoms' }),
  piece({ id: 'shoes', category: 'Shoes' }),
  piece({ id: 'bag', category: 'Bags' }),
]

describe('itemMatchesSeason', () => {
  it('treats All-season on either side as a match', () => {
    expect(itemMatchesSeason('Winter', 'All-season')).toBe(true)
    expect(itemMatchesSeason('All-season', 'Summer')).toBe(true)
  })

  it('requires the same season otherwise', () => {
    expect(itemMatchesSeason('Winter', 'Winter')).toBe(true)
    expect(itemMatchesSeason('Winter', 'Summer')).toBe(false)
  })
})

describe('itemMatchesLookFilters', () => {
  it('checks dress code against the scenario and the season', () => {
    const casualTee = piece({ id: 'tee', category: 'Tops', dressCode: 'Casual' })
    const winterShirt = piece({ id: 'shirt', category: 'Tops', season: 'Winter' })

    expect(itemMatchesLookFilters(casualTee, work, 'All-season')).toBe(false)
    expect(itemMatchesLookFilters(winterShirt, work, 'Winter')).toBe(true)
    expect(itemMatchesLookFilters(winterShirt, work, 'Summer')).toBe(false)
  })
})

describe('getLookSummary', () => {
  it('marks a look complete when every requirement is covered', () => {
    const summary = getLookSummary(look({ itemIds: ['top', 'bottom', 'shoes', 'bag'] }), wardrobe, work)

    expect(summary.isComplete).toBe(true)
    expect(summary.completenessPercent).toBe(100)
    expect(summary.missingCategories).toEqual([])
    expect(summary.recommendedStatus).toBe('Ready')
  })

  it('lists missing categories and rounds the percentage', () => {
    const summary = getLookSummary(look({ itemIds: ['top'] }), wardrobe, work)

    expect(summary.missingCategories).toEqual(['Bottoms', 'Shoes', 'Bags'])
    expect(summary.coveredRequirementCount).toBe(1)
    expect(summary.totalRequirementCount).toBe(4)
    expect(summary.completenessPercent).toBe(25)
    expect(summary.recommendedStatus).toBe('Needs One More Piece')
  })

  it('derives Wishlist-Backed from the linked wishlist items, not from a count', () => {
    const wishes = [
      wish({ id: 'wish-bottoms', category: 'Bottoms' }),
      wish({ id: 'wish-shoes', category: 'Shoes' }),
      wish({ id: 'wish-bags', category: 'Bags' }),
    ]
    const summary = getLookSummary(
      look({ itemIds: ['top'], wishlistItemIds: ['wish-bottoms', 'wish-shoes', 'wish-bags'] }),
      wardrobe,
      work,
      wishes,
    )

    expect(summary.recommendedStatus).toBe('Wishlist-Backed')
    expect(summary.statusReason).toBe('Missing 3 pieces, and each one has a wishlist item linked to this look.')
  })

  it('does not count a bought wishlist item as backing a missing piece', () => {
    const wishes = [wish({ id: 'wish-bottoms', category: 'Bottoms', status: 'Bought' })]
    const summary = getLookSummary(look({ itemIds: ['top'], wishlistItemIds: ['wish-bottoms'] }), wardrobe, work, wishes)

    expect(summary.recommendedStatus).toBe('Needs One More Piece')
  })

  it('is Ready with a completed look even if it has linked wishlist items', () => {
    const wishes = [wish({ id: 'wish-bags', category: 'Bags' })]
    const summary = getLookSummary(
      look({ itemIds: ['top', 'bottom', 'shoes', 'bag'], wishlistItemIds: ['wish-bags'] }),
      wardrobe,
      work,
      wishes,
    )

    expect(summary.recommendedStatus).toBe('Ready')
    expect(summary.statusReason).toBe('Nothing is missing. Every piece this scenario needs is in the closet.')
  })

  it('needs one more piece when a missing category has no wishlist item', () => {
    const wishes = [wish({ id: 'wish-bags', category: 'Bags' })]
    const summary = getLookSummary(look({ itemIds: ['top'], wishlistItemIds: ['wish-bags'] }), wardrobe, work, wishes)

    expect(summary.recommendedStatus).toBe('Needs One More Piece')
    expect(summary.statusReason).toBe(
      'Missing 3 pieces. Still needs a closet piece or a wishlist item for: bottom, shoe option.',
    )
  })

  it('ignores a wishlist item that is not linked to the look', () => {
    const wishes = [wish({ id: 'other', category: 'Bottoms' }), wish({ id: 'wish-shoes', category: 'Shoes' }), wish({ id: 'wish-bags', category: 'Bags' })]
    const summary = getLookSummary(look({ itemIds: ['top'], wishlistItemIds: ['wish-shoes', 'wish-bags'] }), wardrobe, work, wishes)

    expect(summary.recommendedStatus).toBe('Needs One More Piece')
  })

  it('counts each required slot when minCount is above one', () => {
    const layered: Scenario = { ...work, requirements: [{ category: 'Tops', minCount: 2 }] }
    const summary = getLookSummary(look({ itemIds: ['top'] }), wardrobe, layered)

    expect(summary.missingCategories).toEqual(['Tops'])
    expect(summary.completenessPercent).toBe(50)
  })

  it('ignores item ids that are no longer in the closet', () => {
    const summary = getLookSummary(look({ itemIds: ['top', 'deleted'] }), wardrobe, work)

    expect(summary.items.map((item) => item.id)).toEqual(['top'])
  })

  it('returns an empty, incomplete summary when the scenario is unknown', () => {
    const summary = getLookSummary(look({ itemIds: ['top'], status: 'Wishlist-Backed' }), wardrobe, undefined)

    expect(summary.isComplete).toBe(false)
    expect(summary.completenessPercent).toBe(0)
    expect(summary.recommendedStatus).toBe('Wishlist-Backed')
  })

  it('treats a scenario with no requirements as fully covered', () => {
    const open: Scenario = { ...work, requirements: [] }

    expect(getLookSummary(look(), wardrobe, open).completenessPercent).toBe(100)
  })
})

describe('describeLookStatus', () => {
  it('uses one backing wishlist item per missing piece', () => {
    expect(describeLookStatus(['Bottoms', 'Bottoms'], ['Bottoms']).status).toBe('Needs One More Piece')
    expect(describeLookStatus(['Bottoms'], ['Bottoms', 'Bottoms']).status).toBe('Wishlist-Backed')
  })

  it('is Ready when nothing is missing', () => {
    expect(describeLookStatus([], []).status).toBe('Ready')
  })

  it('explains a single missing piece in the singular', () => {
    expect(describeLookStatus(['Shoes'], []).reason).toBe(
      'Missing 1 piece. Still needs a closet piece or a wishlist item for: shoe option.',
    )
  })
})

function wish(overrides: Partial<WishlistItem> & Pick<WishlistItem, 'id' | 'category'>): WishlistItem {
  return {
    title: overrides.id,
    season: 'All-season',
    image: undefined,
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

describe('getUseCountByItem', () => {
  it('counts how many looks use each piece', () => {
    const counts = getUseCountByItem([
      look({ id: 'a', itemIds: ['top', 'bottom'] }),
      look({ id: 'b', itemIds: ['top'] }),
    ])

    expect(counts).toEqual({ top: 2, bottom: 1 })
  })
})

describe('singularCategory', () => {
  it('names a single piece of each category', () => {
    expect(singularCategory('Shoes')).toBe('shoe option')
    expect(singularCategory('Accessories')).toBe('accessory')
  })
})
