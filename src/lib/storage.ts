import { scenarioPresets } from '../data/scenarios'
import type { AppState, Look, Scenario, WishlistItem, WardrobeItem } from '../types'

const storageKey = 'style-aid-state-v2'
const legacyStorageKey = 'style-aid-state-v1'

type LegacyWardrobeItem = {
  id: string
  name: string
  category: WardrobeItem['category']
  color: string
  season: WardrobeItem['season']
  qualityRating: number
  needsReplacing: boolean
}

type LegacyBuyListItem = {
  id: string
  title: string
  category: WardrobeItem['category']
  season: WardrobeItem['season']
  priority: WishlistItem['priority']
  budget: string
  notes: string
  source: 'manual' | 'gap' | 'replacement'
  purchased: boolean
  linkedWardrobeItemId?: string
}

type LegacyState = {
  wardrobe: LegacyWardrobeItem[]
  buyList: LegacyBuyListItem[]
}

function buildSeedWardrobe(): WardrobeItem[] {
  return [
    {
      id: 'item-oxford-shirt',
      name: 'White Oxford Shirt',
      category: 'Tops',
      color: 'White',
      season: 'All-season',
      qualityRating: 5,
      needsReplacing: false,
      dressCode: 'Business Casual',
      formality: 4,
      favorite: true,
      tags: ['capsule', 'work'],
    },
    {
      id: 'item-black-tee',
      name: 'Black Tee',
      category: 'Tops',
      color: 'Black',
      season: 'Summer',
      qualityRating: 4,
      needsReplacing: false,
      dressCode: 'Casual',
      formality: 1,
      favorite: true,
      tags: ['weekend', 'base layer'],
    },
    {
      id: 'item-satin-top',
      name: 'Satin Shell Top',
      category: 'Tops',
      color: 'Champagne',
      season: 'All-season',
      qualityRating: 4,
      needsReplacing: false,
      dressCode: 'Smart Casual',
      formality: 3,
      favorite: false,
      tags: ['night out'],
    },
    {
      id: 'item-dark-jeans',
      name: 'Dark Wash Jeans',
      category: 'Bottoms',
      color: 'Indigo',
      season: 'All-season',
      qualityRating: 4,
      needsReplacing: false,
      dressCode: 'Casual',
      formality: 2,
      favorite: true,
      tags: ['weekend', 'travel'],
    },
    {
      id: 'item-tailored-trousers',
      name: 'Tailored Trousers',
      category: 'Bottoms',
      color: 'Black',
      season: 'All-season',
      qualityRating: 5,
      needsReplacing: false,
      dressCode: 'Business Casual',
      formality: 4,
      favorite: true,
      tags: ['work'],
    },
    {
      id: 'item-wool-coat',
      name: 'Wool Coat',
      category: 'Outerwear',
      color: 'Camel',
      season: 'Winter',
      qualityRating: 3,
      needsReplacing: true,
      dressCode: 'Formal',
      formality: 4,
      favorite: false,
      tags: ['winter'],
    },
    {
      id: 'item-sneakers',
      name: 'White Sneakers',
      category: 'Shoes',
      color: 'White',
      season: 'Spring',
      qualityRating: 4,
      needsReplacing: false,
      dressCode: 'Casual',
      formality: 1,
      favorite: true,
      tags: ['travel', 'weekend'],
    },
    {
      id: 'item-heels',
      name: 'Black Slingbacks',
      category: 'Shoes',
      color: 'Black',
      season: 'All-season',
      qualityRating: 4,
      needsReplacing: false,
      dressCode: 'Formal',
      formality: 4,
      favorite: false,
      tags: ['date night', 'work'],
    },
    {
      id: 'item-crossbody',
      name: 'Crossbody Bag',
      category: 'Bags',
      color: 'Black',
      season: 'All-season',
      qualityRating: 4,
      needsReplacing: false,
      dressCode: 'Smart Casual',
      formality: 3,
      favorite: true,
      tags: ['travel', 'daily'],
    },
    {
      id: 'item-hoops',
      name: 'Gold Hoops',
      category: 'Jewelry',
      color: 'Gold',
      season: 'All-season',
      qualityRating: 4,
      needsReplacing: false,
      dressCode: 'Smart Casual',
      formality: 3,
      favorite: true,
      tags: ['going out'],
    },
    {
      id: 'item-belt',
      name: 'Leather Belt',
      category: 'Accessories',
      color: 'Black',
      season: 'All-season',
      qualityRating: 4,
      needsReplacing: false,
      dressCode: 'Business Casual',
      formality: 3,
      favorite: false,
      tags: ['work'],
    },
  ]
}

function buildSeedLooks(): Look[] {
  return [
    {
      id: 'look-office-uniform',
      name: 'Office Uniform',
      scenarioId: 'work',
      season: 'All-season',
      notes: 'Reliable meeting-day uniform.',
      itemIds: ['item-oxford-shirt', 'item-tailored-trousers', 'item-heels', 'item-crossbody'],
      isPlanned: false,
      rating: 5,
      status: 'Ready',
      missingCategories: [],
      wishlistItemIds: [],
    },
    {
      id: 'look-weekend-coffee',
      name: 'Weekend Coffee Run',
      scenarioId: 'weekend',
      season: 'Spring',
      notes: 'Easy but still intentional.',
      itemIds: ['item-black-tee', 'item-dark-jeans', 'item-sneakers'],
      isPlanned: false,
      rating: 4,
      status: 'Ready',
      missingCategories: [],
      wishlistItemIds: [],
    },
    {
      id: 'look-date-night',
      name: 'Date Night Base',
      scenarioId: 'date-night',
      season: 'Fall',
      notes: 'Missing a stronger finishing layer.',
      itemIds: ['item-satin-top', 'item-tailored-trousers', 'item-heels'],
      isPlanned: true,
      rating: 4,
      status: 'Needs One More Piece',
      missingCategories: ['Accessories'],
      wishlistItemIds: ['wish-shoulder-bag'],
    },
  ]
}

function pickFirstItem(
  wardrobe: WardrobeItem[],
  category: WardrobeItem['category'],
  predicate?: (item: WardrobeItem) => boolean,
) {
  return wardrobe.find(
    (item) => item.category === category && (predicate ? predicate(item) : true),
  )
}

function buildStarterLooksFromWardrobe(wardrobe: WardrobeItem[]): Look[] {
  const workTop = pickFirstItem(wardrobe, 'Tops', (item) => item.dressCode !== 'Casual')
  const workBottom = pickFirstItem(wardrobe, 'Bottoms', (item) => item.dressCode !== 'Casual')
  const workShoes = pickFirstItem(wardrobe, 'Shoes', (item) => item.formality >= 3)
  const workBag = pickFirstItem(wardrobe, 'Bags')

  const weekendTop = pickFirstItem(wardrobe, 'Tops', (item) => item.dressCode === 'Casual')
  const weekendBottom = pickFirstItem(wardrobe, 'Bottoms', (item) => item.dressCode === 'Casual')
  const weekendShoes = pickFirstItem(wardrobe, 'Shoes', (item) => item.dressCode === 'Casual')

  const nightTop = pickFirstItem(wardrobe, 'Tops', (item) => item.formality >= 3)
  const nightBottom = pickFirstItem(wardrobe, 'Bottoms', (item) => item.formality >= 3)
  const nightShoes = pickFirstItem(wardrobe, 'Shoes', (item) => item.formality >= 3)

  const starterLooks: Look[] = []

  if (workTop && workBottom && workShoes) {
    starterLooks.push({
      id: 'starter-work-look',
      name: 'Polished Work Base',
      scenarioId: 'work',
      season: 'All-season',
      notes: 'A strong work starter built from your current closet.',
      itemIds: [workTop.id, workBottom.id, workShoes.id, workBag?.id].filter(Boolean) as string[],
      isPlanned: false,
      rating: 4,
      status: 'Ready',
      missingCategories: [],
      wishlistItemIds: [],
    })
  }

  if (weekendTop && weekendBottom && weekendShoes) {
    starterLooks.push({
      id: 'starter-weekend-look',
      name: 'Weekend Uniform',
      scenarioId: 'weekend',
      season: 'All-season',
      notes: 'An easy off-duty look from what you already own.',
      itemIds: [weekendTop.id, weekendBottom.id, weekendShoes.id],
      isPlanned: false,
      rating: 4,
      status: 'Ready',
      missingCategories: [],
      wishlistItemIds: [],
    })
  }

  if (nightTop && nightBottom && nightShoes) {
    starterLooks.push({
      id: 'starter-going-out-look',
      name: 'Going Out Draft',
      scenarioId: 'going-out',
      season: 'All-season',
      notes: 'Close to ready, with room for one stronger finishing piece.',
      itemIds: [nightTop.id, nightBottom.id, nightShoes.id],
      isPlanned: true,
      rating: 4,
      status: 'Needs One More Piece',
      missingCategories: ['Jewelry'],
      wishlistItemIds: [],
    })
  }

  return starterLooks
}

function buildSeedWishlist(): WishlistItem[] {
  return [
    {
      id: 'wish-shoulder-bag',
      title: 'Structured evening shoulder bag',
      category: 'Bags',
      season: 'All-season',
      image: undefined,
      brand: 'Staud',
      retailer: 'Nordstrom',
      productUrl: '',
      targetPrice: '250',
      currentPrice: '295',
      priority: 'Medium',
      status: 'Watching',
      notes: 'Would finish date-night looks and dress up work dinners.',
      scenarioIds: ['date-night', 'going-out'],
      intendedWithItemIds: ['item-satin-top', 'item-heels'],
      intendedLookIds: ['look-date-night'],
      isReplacement: false,
      purchased: false,
    },
    {
      id: 'wish-coat-replacement',
      title: 'Replace Wool Coat',
      category: 'Outerwear',
      season: 'Winter',
      image: undefined,
      brand: '',
      retailer: '',
      productUrl: '',
      targetPrice: '300',
      currentPrice: '',
      priority: 'High',
      status: 'Researching',
      notes: 'Current coat is worn out. Looking for something warm and polished.',
      scenarioIds: ['work'],
      intendedWithItemIds: ['item-oxford-shirt', 'item-tailored-trousers'],
      intendedLookIds: [],
      isReplacement: true,
      purchased: false,
      linkedWardrobeItemId: 'item-wool-coat',
    },
  ]
}

function buildDefaultStyleProfile(): AppState['styleProfile'] {
  return {
    focusScenarioIds: ['work', 'going-out', 'weekend'],
    defaultSeason: 'All-season',
  }
}

export function buildSeedState(): AppState {
  const wardrobe = buildSeedWardrobe()
  const looks = buildSeedLooks()
  const wishlist = buildSeedWishlist()

  return {
    wardrobe,
    scenarios: scenarioPresets,
    looks,
    wishlist: syncReplacementWishlistEntries(wardrobe, wishlist, scenarioPresets),
    styleProfile: buildDefaultStyleProfile(),
  }
}

function migrateWardrobeItem(item: LegacyWardrobeItem): WardrobeItem {
  return {
    ...item,
    dressCode:
      item.category === 'Shoes' || item.category === 'Jewelry'
        ? 'Smart Casual'
        : item.category === 'Outerwear'
          ? 'Formal'
          : 'Casual',
    formality:
      item.category === 'Outerwear' ? 4 : item.category === 'Shoes' || item.category === 'Bags' ? 3 : 2,
    favorite: false,
    tags: [],
  }
}

function migrateWishlistItem(entry: LegacyBuyListItem): WishlistItem {
  return {
    id: `migrated-${entry.id}`,
    title: entry.title,
    category: entry.category,
    season: entry.season,
    image: undefined,
    brand: '',
    retailer: '',
    productUrl: '',
    targetPrice: entry.budget,
    currentPrice: '',
    priority: entry.priority,
    status: entry.purchased ? 'Bought' : entry.source === 'gap' ? 'Watching' : 'Researching',
    notes: entry.notes,
    scenarioIds: [],
    intendedWithItemIds: [],
    intendedLookIds: [],
    isReplacement: entry.source === 'replacement',
    purchased: entry.purchased,
    linkedWardrobeItemId: entry.linkedWardrobeItemId,
  }
}

function createReplacementWishlistItem(item: WardrobeItem, scenarios: Scenario[], existing?: WishlistItem): WishlistItem {
  const suggestedScenarioIds = scenarios
    .filter((scenario) => scenario.requirements.some((requirement) => requirement.category === item.category))
    .slice(0, 2)
    .map((scenario) => scenario.id)

  return {
    id: existing?.id ?? `replacement-${item.id}`,
    title: existing?.title ?? `Replace ${item.name}`,
    category: item.category,
    season: item.season,
    image: existing?.image,
    brand: existing?.brand ?? '',
    retailer: existing?.retailer ?? '',
    productUrl: existing?.productUrl ?? '',
    targetPrice: existing?.targetPrice ?? '',
    currentPrice: existing?.currentPrice ?? '',
    priority: existing?.priority ?? 'High',
    status: existing?.status ?? 'Researching',
    notes:
      existing?.notes ??
      `Current piece is marked for replacement. Find a stronger ${item.category.toLowerCase()} option.`,
    scenarioIds: existing?.scenarioIds.length ? existing.scenarioIds : suggestedScenarioIds,
    intendedWithItemIds: existing?.intendedWithItemIds ?? [],
    intendedLookIds: existing?.intendedLookIds ?? [],
    isReplacement: true,
    purchased: existing?.purchased ?? false,
    linkedWardrobeItemId: item.id,
  }
}

export function syncReplacementWishlistEntries(
  wardrobe: WardrobeItem[],
  wishlist: WishlistItem[],
  scenarios: Scenario[],
) {
  const regularItems = wishlist.filter((item) => !item.isReplacement)
  const existingReplacements = new Map(
    wishlist
      .filter((item) => item.isReplacement && item.linkedWardrobeItemId)
      .map((item) => [item.linkedWardrobeItemId as string, item]),
  )

  const syncedReplacements = wardrobe
    .filter((item) => item.needsReplacing)
    .map((item) => createReplacementWishlistItem(item, scenarios, existingReplacements.get(item.id)))

  return [...regularItems, ...syncedReplacements]
}

function normalizeLoadedState(state: AppState): AppState {
  const normalizedScenarios = state.scenarios?.length ? state.scenarios : scenarioPresets
  const normalizedWardrobe = state.wardrobe ?? []
  const normalizedLooks =
    state.looks && state.looks.length > 0
      ? state.looks
      : buildStarterLooksFromWardrobe(normalizedWardrobe)

  return {
    ...state,
    scenarios: normalizedScenarios,
    looks: normalizedLooks,
    wishlist: syncReplacementWishlistEntries(
      normalizedWardrobe,
      state.wishlist ?? [],
      normalizedScenarios,
    ),
    styleProfile: state.styleProfile ?? buildDefaultStyleProfile(),
  }
}

function migrateLegacyState(legacyState: LegacyState): AppState {
  const wardrobe = (legacyState.wardrobe ?? []).map(migrateWardrobeItem)
  const wishlist = (legacyState.buyList ?? []).map(migrateWishlistItem)

  return normalizeLoadedState({
    wardrobe,
    scenarios: scenarioPresets,
    looks: [],
    wishlist,
    styleProfile: buildDefaultStyleProfile(),
  })
}

export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return buildSeedState()
  }

  const current = window.localStorage.getItem(storageKey)
  if (current) {
    try {
      return normalizeLoadedState(JSON.parse(current) as AppState)
    } catch {
      return buildSeedState()
    }
  }

  const legacy = window.localStorage.getItem(legacyStorageKey)
  if (legacy) {
    try {
      return migrateLegacyState(JSON.parse(legacy) as LegacyState)
    } catch {
      return buildSeedState()
    }
  }

  return buildSeedState()
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(state))
}
