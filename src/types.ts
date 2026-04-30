export const categories = [
  'Tops',
  'Bottoms',
  'Outerwear',
  'Shoes',
  'Watches',
  'Jewelry',
  'Bags',
  'Accessories',
] as const

export const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'All-season'] as const

export const priorities = ['High', 'Medium', 'Low'] as const

export const wishlistStatuses = ['Researching', 'Watching', 'Ready to Buy', 'Bought'] as const

export const dressCodes = ['Casual', 'Smart Casual', 'Business Casual', 'Formal'] as const

export const lookStatuses = ['Ready', 'Needs One More Piece', 'Wishlist-Backed'] as const

export const appTabs = ['Home', 'Looks', 'Closet', 'Wishlist', 'Insights'] as const

export type Category = (typeof categories)[number]
export type Season = (typeof seasons)[number]
export type Priority = (typeof priorities)[number]
export type WishlistStatus = (typeof wishlistStatuses)[number]
export type DressCode = (typeof dressCodes)[number]
export type LookStatus = (typeof lookStatuses)[number]
export type AppTab = (typeof appTabs)[number]

export type WardrobeItem = {
  id: string
  name: string
  category: Category
  color: string
  season: Season
  qualityRating: number
  needsReplacing: boolean
  dressCode: DressCode
  formality: number
  favorite: boolean
  tags: string[]
  image?: string
}

export type ScenarioRequirement = {
  category: Category
  minCount: number
}

export type Scenario = {
  id: string
  name: string
  description: string
  dressCodes: DressCode[]
  seasons: Season[]
  requirements: ScenarioRequirement[]
}

export type Look = {
  id: string
  name: string
  scenarioId: string
  season: Season
  notes: string
  itemIds: string[]
  isPlanned: boolean
  rating: number
  status: LookStatus
  missingCategories: Category[]
  wishlistItemIds: string[]
}

export type WishlistItem = {
  id: string
  title: string
  category: Category
  season: Season
  image?: string
  brand: string
  retailer: string
  productUrl: string
  targetPrice: string
  currentPrice: string
  priority: Priority
  status: WishlistStatus
  notes: string
  scenarioIds: string[]
  intendedWithItemIds: string[]
  intendedLookIds: string[]
  isReplacement: boolean
  purchased: boolean
  linkedWardrobeItemId?: string
}

export type StyleProfile = {
  focusScenarioIds: string[]
  defaultSeason: Season
}

export type AppState = {
  wardrobe: WardrobeItem[]
  scenarios: Scenario[]
  looks: Look[]
  wishlist: WishlistItem[]
  styleProfile: StyleProfile
}

export type LookSummary = {
  items: WardrobeItem[]
  missingCategories: Category[]
  coveredRequirementCount: number
  totalRequirementCount: number
  completenessPercent: number
  recommendedStatus: LookStatus
  isComplete: boolean
}

export type ScenarioCoverage = {
  scenario: Scenario
  completeLooks: number
  plannedLooks: number
  coveragePercent: number
  averageCompleteness: number
  strongestLookPercent: number
}

export type RankedGap = {
  category: Category
  scenarioId: string
  score: number
  affectedLookIds: string[]
  reason: string
}

export type WishlistInsight = {
  item: WishlistItem
  usefulnessScore: number
  unlockedLookCount: number
  costPerLook: number | null
}

export type ImportedProductData = {
  title: string
  brand: string
  retailer: string
  currentPrice: string
  image?: string
  productUrl: string
  category?: Category
}
