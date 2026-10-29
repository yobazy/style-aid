import { getLookSummary, singularCategory } from './looks'
import type {
  AppState,
  Category,
  Look,
  RankedGap,
  Scenario,
  ScenarioCoverage,
  WishlistInsight,
  WishlistItem,
} from '../types'

export function parsePrice(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatLookCount(count: number) {
  return `${count} ${count === 1 ? 'look' : 'looks'}`
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function getScenarioCoverage(
  looks: Look[],
  wardrobe: AppState['wardrobe'],
  scenarios: Scenario[],
): ScenarioCoverage[] {
  return scenarios.map((scenario) => {
    const scenarioLooks = looks.filter((look) => look.scenarioId === scenario.id)
    const summaries = scenarioLooks.map((look) => getLookSummary(look, wardrobe, scenario))
    const completeLooks = summaries.filter((summary) => summary.isComplete).length
    const averageCompleteness =
      summaries.length === 0
        ? 0
        : Math.round(
            summaries.reduce((sum, summary) => sum + summary.completenessPercent, 0) /
              summaries.length,
          )
    const strongestLookPercent = summaries.length
      ? Math.max(...summaries.map((summary) => summary.completenessPercent))
      : 0

    return {
      scenario,
      completeLooks,
      plannedLooks: scenarioLooks.length,
      coveragePercent: averageCompleteness,
      averageCompleteness,
      strongestLookPercent,
    }
  })
}

function getCategoryCount(items: Category[]) {
  return items.reduce<Record<Category, number>>(
    (counts, category) => ({
      ...counts,
      [category]: (counts[category] ?? 0) + 1,
    }),
    {
      Tops: 0,
      Bottoms: 0,
      Outerwear: 0,
      Shoes: 0,
      Watches: 0,
      Jewelry: 0,
      Bags: 0,
      Accessories: 0,
    },
  )
}

export function getRankedGaps(state: AppState): RankedGap[] {
  const scenarioMap = new Map(state.scenarios.map((scenario) => [scenario.id, scenario]))
  const gaps: RankedGap[] = []

  for (const look of state.looks) {
    const scenario = scenarioMap.get(look.scenarioId)
    const summary = getLookSummary(look, state.wardrobe, scenario)
    const counts = getCategoryCount(summary.missingCategories)

    for (const [category, amount] of Object.entries(counts) as [Category, number][]) {
      if (amount === 0) {
        continue
      }

      gaps.push({
        category,
        scenarioId: look.scenarioId,
        score: amount * 2 + (look.isPlanned ? 1 : 0),
        affectedLookIds: [look.id],
        reason: `${singularCategory(category)} would unblock ${look.name}.`,
      })
    }
  }

  const replacementGaps = state.wardrobe
    .filter((item) => item.needsReplacing)
    .map((item) => ({
      category: item.category,
      scenarioId: '',
      score: 2,
      affectedLookIds: [],
      reason: `Replace ${item.name} to keep current outfits working.`,
    }))

  const grouped = new Map<string, RankedGap>()
  for (const gap of [...gaps, ...replacementGaps]) {
    const key = `${gap.scenarioId}-${gap.category}`
    const existing = grouped.get(key)
    if (!existing) {
      grouped.set(key, gap)
      continue
    }

    grouped.set(key, {
      ...existing,
      score: existing.score + gap.score,
      affectedLookIds: [...new Set([...existing.affectedLookIds, ...gap.affectedLookIds])],
      reason: existing.reason,
    })
  }

  return [...grouped.values()].sort((left, right) => right.score - left.score)
}

export function getWishlistInsights(state: AppState): WishlistInsight[] {
  return state.wishlist.map((item) => {
    const lookCount = item.intendedLookIds.length
    const scenarioCount = item.scenarioIds.length
    const pairingCount = item.intendedWithItemIds.length
    const priceSignal = item.currentPrice ? 1 : 0
    const replacementSignal = item.isReplacement ? 2 : 0
    const workingPrice = parsePrice(item.currentPrice || item.targetPrice)

    return {
      item,
      usefulnessScore:
        lookCount * 4 + scenarioCount * 3 + pairingCount * 2 + priceSignal + replacementSignal,
      unlockedLookCount: lookCount,
      costPerLook: lookCount > 0 && workingPrice > 0 ? workingPrice / lookCount : null,
    }
  })
}

// Most useful items still to buy, best first.
export function getTopWishlistInsights(insights: WishlistInsight[], limit: number) {
  return insights
    .filter(({ item }) => item.status !== 'Bought' && !item.purchased)
    .sort((left, right) => right.usefulnessScore - left.usefulnessScore)
    .slice(0, limit)
}

export function getWishlistSpend(wishlist: WishlistItem[]) {
  return wishlist
    .filter((item) => item.status !== 'Bought' && !item.purchased)
    .reduce((sum, item) => sum + parsePrice(item.currentPrice || item.targetPrice), 0)
}
