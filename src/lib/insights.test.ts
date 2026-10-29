import { describe, expect, it } from 'vitest'
import type { AppState, WishlistItem } from '../types'
import {
  formatCurrency,
  getRankedGaps,
  getScenarioCoverage,
  getTopWishlistInsights,
  getWishlistInsights,
  getWishlistSpend,
  formatLookCount,
  parsePrice,
} from './insights'
import { buildSeedState } from './storage'

function wish(overrides: Partial<WishlistItem> & Pick<WishlistItem, 'id'>): WishlistItem {
  return {
    title: overrides.id,
    category: 'Bags',
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

describe('parsePrice', () => {
  it('strips currency symbols and thousands separators', () => {
    expect(parsePrice('$295')).toBe(295)
    expect(parsePrice('1,200.50')).toBe(1200.5)
    expect(parsePrice('')).toBe(0)
  })

  it('returns 0 for text it cannot read', () => {
    expect(parsePrice('1.2.3')).toBe(0)
  })
})

describe('formatLookCount', () => {
  it('uses the singular for one look', () => {
    expect(formatLookCount(0)).toBe('0 looks')
    expect(formatLookCount(1)).toBe('1 look')
    expect(formatLookCount(3)).toBe('3 looks')
  })
})

describe('formatCurrency', () => {
  it('formats whole US dollars', () => {
    expect(formatCurrency(1234.4)).toBe('$1,234')
  })
})

describe('getScenarioCoverage', () => {
  it('averages look completeness per scenario for the seed closet', () => {
    const state = buildSeedState()
    const coverage = getScenarioCoverage(state.looks, state.wardrobe, state.scenarios)
    const byId = Object.fromEntries(coverage.map((entry) => [entry.scenario.id, entry]))

    expect(byId.work).toMatchObject({ completeLooks: 1, plannedLooks: 1, coveragePercent: 100 })
    expect(byId['date-night']).toMatchObject({ completeLooks: 0, coveragePercent: 75, strongestLookPercent: 75 })
    expect(byId.travel).toMatchObject({ plannedLooks: 0, coveragePercent: 0, strongestLookPercent: 0 })
  })
})

describe('getRankedGaps', () => {
  it('ranks missing pieces from looks and replacement needs', () => {
    const gaps = getRankedGaps(buildSeedState())

    expect(gaps.map((gap) => `${gap.scenarioId}:${gap.category}:${gap.score}`)).toEqual([
      'date-night:Accessories:3',
      ':Outerwear:2',
    ])
    expect(gaps[0].affectedLookIds).toEqual(['look-date-night'])
  })

  it('merges the same gap across looks and adds up the score', () => {
    const state = buildSeedState()
    const next: AppState = {
      ...state,
      looks: [
        { ...state.looks[0], id: 'a', itemIds: [], isPlanned: false },
        { ...state.looks[0], id: 'b', itemIds: [], isPlanned: true },
      ],
      wardrobe: state.wardrobe.map((item) => ({ ...item, needsReplacing: false })),
    }

    const bags = getRankedGaps(next).find((gap) => gap.category === 'Bags')
    expect(bags).toMatchObject({ scenarioId: 'work', score: 5, affectedLookIds: ['a', 'b'] })
  })
})

describe('getWishlistInsights', () => {
  it('scores usefulness from looks, scenarios, pairings, price and replacement', () => {
    const state = { ...buildSeedState(), wishlist: [
      wish({
        id: 'w',
        intendedLookIds: ['l1', 'l2'],
        scenarioIds: ['work'],
        intendedWithItemIds: ['i1'],
        currentPrice: '$200',
        isReplacement: true,
      }),
    ] }

    const [insight] = getWishlistInsights(state)
    expect(insight.usefulnessScore).toBe(2 * 4 + 3 + 2 + 1 + 2)
    expect(insight.unlockedLookCount).toBe(2)
    expect(insight.costPerLook).toBe(100)
  })

  it('has no cost per look without looks or a price', () => {
    const state = { ...buildSeedState(), wishlist: [wish({ id: 'a', targetPrice: '50' }), wish({ id: 'b', intendedLookIds: ['l'] })] }

    expect(getWishlistInsights(state).map((entry) => entry.costPerLook)).toEqual([null, null])
  })
})

describe('getTopWishlistInsights', () => {
  it('orders by usefulness and leaves out bought items', () => {
    const state = {
      ...buildSeedState(),
      wishlist: [
        wish({ id: 'low' }),
        wish({ id: 'high', intendedLookIds: ['l1', 'l2'] }),
        wish({ id: 'bought', intendedLookIds: ['l1', 'l2', 'l3'], status: 'Bought', purchased: true }),
        wish({ id: 'mid', scenarioIds: ['work'] }),
      ],
    }

    const top = getTopWishlistInsights(getWishlistInsights(state), 2)
    expect(top.map((entry) => entry.item.id)).toEqual(['high', 'mid'])
  })
})

describe('getWishlistSpend', () => {
  it('adds current price, falling back to target, and skips bought items', () => {
    const total = getWishlistSpend([
      wish({ id: 'a', currentPrice: '$100', targetPrice: '80' }),
      wish({ id: 'b', targetPrice: '50' }),
      wish({ id: 'c', currentPrice: '999', status: 'Bought', purchased: true }),
      wish({ id: 'd', currentPrice: '999', purchased: true }),
    ])

    expect(total).toBe(150)
  })
})
