import type {
  Category,
  DressCode,
  Look,
  LookStatus,
  LookSummary,
  Scenario,
  Season,
  WardrobeItem,
} from '../types'

export function itemMatchesSeason(itemSeason: Season, targetSeason: Season) {
  return targetSeason === 'All-season' || itemSeason === 'All-season' || itemSeason === targetSeason
}

export function itemMatchesScenario(item: WardrobeItem, scenario: Scenario) {
  return scenario.dressCodes.includes(item.dressCode)
}

export function itemMatchesLookFilters(item: WardrobeItem, scenario: Scenario, season: Season) {
  return itemMatchesScenario(item, scenario) && itemMatchesSeason(item.season, season)
}

export function singularCategory(category: Category) {
  const names: Record<Category, string> = {
    Tops: 'top',
    Bottoms: 'bottom',
    Outerwear: 'outerwear piece',
    Shoes: 'shoe option',
    Watches: 'watch',
    Jewelry: 'jewelry piece',
    Bags: 'bag',
    Accessories: 'accessory',
  }

  return names[category]
}

export function categoriesForMissing(requirementCategory: Category, amount: number) {
  return Array.from({ length: amount }, () => requirementCategory)
}

export function getLookSummary(
  look: Look,
  wardrobe: WardrobeItem[],
  scenario: Scenario | undefined,
): LookSummary {
  const itemMap = new Map(wardrobe.map((item) => [item.id, item]))
  const items = look.itemIds
    .map((itemId) => itemMap.get(itemId))
    .filter((item): item is WardrobeItem => Boolean(item))

  if (!scenario) {
    return {
      items,
      missingCategories: [],
      coveredRequirementCount: 0,
      totalRequirementCount: 0,
      completenessPercent: 0,
      recommendedStatus: look.status,
      isComplete: false,
    }
  }

  const categoryCounts = items.reduce<Record<Category, number>>(
    (counts, item) => ({
      ...counts,
      [item.category]: (counts[item.category] ?? 0) + 1,
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

  const missingCategories = scenario.requirements.flatMap((requirement) => {
    const count = categoryCounts[requirement.category] ?? 0
    const missingCount = Math.max(requirement.minCount - count, 0)
    return categoriesForMissing(requirement.category, missingCount)
  })

  const totalRequirementCount = scenario.requirements.reduce(
    (sum, requirement) => sum + requirement.minCount,
    0,
  )
  const coveredRequirementCount = totalRequirementCount - missingCategories.length
  const completenessPercent =
    totalRequirementCount === 0
      ? 100
      : Math.round((coveredRequirementCount / totalRequirementCount) * 100)

  let recommendedStatus: LookStatus = 'Ready'
  if (missingCategories.length > 1 && look.wishlistItemIds.length > 0) {
    recommendedStatus = 'Wishlist-Backed'
  } else if (missingCategories.length > 0) {
    recommendedStatus = 'Needs One More Piece'
  }

  return {
    items,
    missingCategories,
    coveredRequirementCount,
    totalRequirementCount,
    completenessPercent,
    recommendedStatus,
    isComplete: missingCategories.length === 0,
  }
}

export function getMissingCategoriesForLook(
  look: Look,
  wardrobe: WardrobeItem[],
  scenario: Scenario | undefined,
) {
  return getLookSummary(look, wardrobe, scenario).missingCategories
}

export function getUseCountByItem(looks: Look[]) {
  return looks.reduce<Record<string, number>>((counts, look) => {
    for (const itemId of look.itemIds) {
      counts[itemId] = (counts[itemId] ?? 0) + 1
    }

    return counts
  }, {})
}

export function createStatusFromSummary(summary: LookSummary) {
  return summary.recommendedStatus
}

export function dressCodeLabel(code: DressCode) {
  return code
}
