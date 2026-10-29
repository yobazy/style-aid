import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scenarioPresets } from '../data/scenarios'
import type { AppState } from '../types'
import { buildSeedState, loadState, saveState, syncReplacementWishlistEntries } from './storage'

class MemoryStorage {
  values = new Map<string, string>()
  getItem(key: string) {
    return this.values.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
  removeItem(key: string) {
    this.values.delete(key)
  }
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  vi.stubGlobal('window', { localStorage: storage })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildSeedState', () => {
  it('creates a replacement wishlist entry for each piece marked to replace', () => {
    const state = buildSeedState()
    const replacements = state.wishlist.filter((item) => item.isReplacement)

    expect(replacements).toHaveLength(1)
    expect(replacements[0]).toMatchObject({ linkedWardrobeItemId: 'item-wool-coat', title: 'Replace Wool Coat' })
  })
})

describe('syncReplacementWishlistEntries', () => {
  const seed = buildSeedState()

  it('adds an entry when a piece is newly marked to replace', () => {
    const wardrobe = seed.wardrobe.map((item) =>
      item.id === 'item-sneakers' ? { ...item, needsReplacing: true } : item,
    )
    const wishlist = syncReplacementWishlistEntries(wardrobe, seed.wishlist, scenarioPresets)
    const added = wishlist.find((item) => item.linkedWardrobeItemId === 'item-sneakers')

    expect(added).toMatchObject({
      id: 'replacement-item-sneakers',
      title: 'Replace White Sneakers',
      category: 'Shoes',
      priority: 'High',
      isReplacement: true,
    })
    expect(added?.scenarioIds.length).toBeGreaterThan(0)
  })

  it('keeps edits the user made to an existing replacement entry', () => {
    const edited = seed.wishlist.map((item) =>
      item.isReplacement ? { ...item, currentPrice: '320', status: 'Ready to Buy' as const } : item,
    )
    const wishlist = syncReplacementWishlistEntries(seed.wardrobe, edited, scenarioPresets)

    expect(wishlist.find((item) => item.isReplacement)).toMatchObject({
      currentPrice: '320',
      status: 'Ready to Buy',
    })
  })

  it('drops the entry when the piece is no longer marked to replace', () => {
    const wardrobe = seed.wardrobe.map((item) => ({ ...item, needsReplacing: false }))
    const wishlist = syncReplacementWishlistEntries(wardrobe, seed.wishlist, scenarioPresets)

    expect(wishlist.some((item) => item.isReplacement)).toBe(false)
    expect(wishlist).toHaveLength(seed.wishlist.length - 1)
  })
})

describe('loadState and saveState', () => {
  it('returns the seed state when nothing is stored', () => {
    expect(loadState()).toEqual(buildSeedState())
  })

  it('round-trips saved state', () => {
    const state = buildSeedState()
    const next: AppState = { ...state, wardrobe: state.wardrobe.slice(0, 3) }
    saveState(next)

    expect(loadState().wardrobe).toEqual(next.wardrobe)
  })

  it('falls back to the seed state when stored JSON is corrupt', () => {
    storage.setItem('style-aid-state-v2', '{not json')

    expect(loadState()).toEqual(buildSeedState())
  })

  it('builds starter looks when stored state has a closet but no looks', () => {
    const state = buildSeedState()
    storage.setItem('style-aid-state-v2', JSON.stringify({ ...state, looks: [] }))

    expect(loadState().looks.map((look) => look.id)).toEqual([
      'starter-work-look',
      'starter-weekend-look',
      'starter-going-out-look',
    ])
  })

  it('migrates v1 state into the current shape', () => {
    storage.setItem(
      'style-aid-state-v1',
      JSON.stringify({
        wardrobe: [
          { id: 'c1', name: 'Old Coat', category: 'Outerwear', color: 'Navy', season: 'Winter', qualityRating: 2, needsReplacing: true },
        ],
        buyList: [
          { id: 'b1', title: 'Belt', category: 'Accessories', season: 'All-season', priority: 'Low', budget: '40', notes: '', source: 'gap', purchased: false },
        ],
      }),
    )

    const state = loadState()
    expect(state.wardrobe[0]).toMatchObject({ id: 'c1', dressCode: 'Formal', formality: 4, favorite: false, tags: [] })
    expect(state.wishlist.find((item) => item.id === 'migrated-b1')).toMatchObject({ targetPrice: '40', status: 'Watching' })
    expect(state.wishlist.find((item) => item.linkedWardrobeItemId === 'c1')?.isReplacement).toBe(true)
    expect(state.scenarios).toEqual(scenarioPresets)
  })
})
