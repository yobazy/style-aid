import { describe, expect, it } from 'vitest'
import { scenarioPresets } from '../data/scenarios'
import type { Look, Scenario, WardrobeItem } from '../types'
import {
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

  it('suggests Wishlist-Backed when several pieces are missing and a wishlist item backs the look', () => {
    const summary = getLookSummary(look({ itemIds: ['top'], wishlistItemIds: ['wish-1'] }), wardrobe, work)

    expect(summary.recommendedStatus).toBe('Wishlist-Backed')
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
