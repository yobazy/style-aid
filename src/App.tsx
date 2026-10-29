import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import './App.css'
import { ClosetView } from './components/ClosetView'
import { DashboardView } from './components/DashboardView'
import { InsightsView } from './components/InsightsView'
import { LooksView } from './components/LooksView'
import { WishlistView } from './components/WishlistView'
import {
  getRankedGaps,
  getScenarioCoverage,
  getTopWishlistInsights,
  getWishlistInsights,
  getWishlistSpend,
} from './lib/insights'
import { getLookSummary } from './lib/looks'
import { findMergeTarget, mergeWishlistEntry } from './lib/wishlist'
import {
  getLastSaveFailed,
  loadState,
  saveState,
  subscribeToSaveStatus,
  syncReplacementWishlistEntries,
} from './lib/storage'
import type { AppState, AppTab, Category, Look, LookStatus, Season, WishlistItem, WardrobeItem } from './types'
import { appTabs } from './types'

function syncAppState(next: AppState): AppState {
  const syncedWishlist = syncReplacementWishlistEntries(
    next.wardrobe,
    next.wishlist,
    next.scenarios,
  )
  const scenarioMap = new Map(next.scenarios.map((scenario) => [scenario.id, scenario]))
  const syncedLooks = next.looks.map((look) => {
    const wishlistItemIds = syncedWishlist
      .filter((item) => item.intendedLookIds.includes(look.id))
      .map((item) => item.id)
    const summary = getLookSummary(
      { ...look, wishlistItemIds },
      next.wardrobe,
      scenarioMap.get(look.scenarioId),
    )

    return {
      ...look,
      missingCategories: summary.missingCategories,
      wishlistItemIds,
    }
  })

  return {
    ...next,
    looks: syncedLooks,
    wishlist: syncedWishlist,
  }
}

function App() {
  const [appState, setAppState] = useState<AppState>(() => syncAppState(loadState()))
  const [activeTab, setActiveTab] = useState<AppTab>('Home')
  const saveFailed = useSyncExternalStore(subscribeToSaveStatus, getLastSaveFailed)

  useEffect(() => {
    saveState(appState)
  }, [appState])

  function updateState(updater: (current: AppState) => AppState) {
    setAppState((current) => syncAppState(updater(current)))
  }

  const scenarioMap = useMemo(
    () => new Map(appState.scenarios.map((scenario) => [scenario.id, scenario])),
    [appState.scenarios],
  )

  const scenarioCoverage = useMemo(
    () => getScenarioCoverage(appState.looks, appState.wardrobe, appState.scenarios),
    [appState.looks, appState.scenarios, appState.wardrobe],
  )

  const wishlistInsights = useMemo(() => getWishlistInsights(appState), [appState])
  const rankedGaps = useMemo(() => getRankedGaps(appState), [appState])
  const estimatedSpend = useMemo(
    () => getWishlistSpend(appState.wishlist),
    [appState.wishlist],
  )

  const topLooks = useMemo(
    () =>
      [...appState.looks]
        .map((look) => ({
          look,
          scenarioName: scenarioMap.get(look.scenarioId)?.name ?? 'Scenario',
          summary: getLookSummary(look, appState.wardrobe, scenarioMap.get(look.scenarioId)),
        }))
        .sort(
          (left, right) =>
            right.summary.completenessPercent - left.summary.completenessPercent ||
            right.look.rating - left.look.rating,
        )
        .slice(0, 3),
    [appState.looks, appState.wardrobe, scenarioMap],
  )

  const topWishlist = useMemo(
    () => getTopWishlistInsights(wishlistInsights, 3),
    [wishlistInsights],
  )

  function addWardrobeItem(draft: Omit<WardrobeItem, 'id' | 'tags'> & { tags: string[] }) {
    updateState((current) => ({
      ...current,
      wardrobe: [
        {
          id: crypto.randomUUID(),
          ...draft,
        },
        ...current.wardrobe,
      ],
    }))
  }

  function toggleWardrobeFavorite(itemId: string) {
    updateState((current) => ({
      ...current,
      wardrobe: current.wardrobe.map((item) =>
        item.id === itemId ? { ...item, favorite: !item.favorite } : item,
      ),
    }))
  }

  function toggleWardrobeReplacement(itemId: string) {
    updateState((current) => ({
      ...current,
      wardrobe: current.wardrobe.map((item) =>
        item.id === itemId ? { ...item, needsReplacing: !item.needsReplacing } : item,
      ),
    }))
  }

  function addLook(draft: Omit<Look, 'id' | 'status' | 'missingCategories' | 'wishlistItemIds'>) {
    const scenario = scenarioMap.get(draft.scenarioId)
    const previewLook: Look = {
      id: crypto.randomUUID(),
      ...draft,
      status: 'Ready',
      missingCategories: [],
      wishlistItemIds: [],
    }
    const summary = getLookSummary(previewLook, appState.wardrobe, scenario)

    updateState((current) => ({
      ...current,
      looks: [
        {
          ...previewLook,
          status: summary.recommendedStatus,
          missingCategories: summary.missingCategories,
        },
        ...current.looks,
      ],
    }))
  }

  function updateLookStatus(lookId: string, status: LookStatus) {
    updateState((current) => ({
      ...current,
      looks: current.looks.map((look) => (look.id === lookId ? { ...look, status } : look)),
    }))
  }

  function upsertWishlistItem(item: WishlistItem) {
    updateState((current) => {
      const existing = findMergeTarget(current.wishlist, item)

      if (!existing) {
        return {
          ...current,
          wishlist: [item, ...current.wishlist],
        }
      }

      const merged = mergeWishlistEntry(existing, item)

      return {
        ...current,
        wishlist: current.wishlist.map((entry) => (entry.id === existing.id ? merged : entry)),
      }
    })
  }

  function addWishlistItem(draft: Omit<WishlistItem, 'id' | 'isReplacement' | 'purchased'>) {
    upsertWishlistItem({
      id: crypto.randomUUID(),
      ...draft,
      isReplacement: false,
      purchased: draft.status === 'Bought',
    })
  }

  function updateWishlistItem(itemId: string, patch: Partial<WishlistItem>) {
    updateState((current) => ({
      ...current,
      wishlist: current.wishlist.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    }))
  }

  function removeWishlistItem(itemId: string) {
    updateState((current) => ({
      ...current,
      wishlist: current.wishlist.filter((item) => item.id !== itemId),
    }))
  }

  function createWishlistIdea(input: {
    title: string
    category: Category
    season: Season
    scenarioIds: string[]
    intendedLookIds: string[]
    intendedWithItemIds: string[]
    notes: string
  }) {
    upsertWishlistItem({
      id: crypto.randomUUID(),
      title: input.title,
      category: input.category,
      season: input.season,
      image: undefined,
      brand: '',
      retailer: '',
      productUrl: '',
      targetPrice: '',
      currentPrice: '',
      priority: input.intendedLookIds.length > 0 ? 'High' : 'Medium',
      status: 'Researching',
      notes: input.notes,
      scenarioIds: input.scenarioIds,
      intendedWithItemIds: input.intendedWithItemIds,
      intendedLookIds: input.intendedLookIds,
      isReplacement: false,
      purchased: false,
    })
    setActiveTab('Wishlist')
  }

  return (
    <div className="app-shell">
      <nav className="tab-bar" aria-label="Primary">
        {appTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? 'tab is-active' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {saveFailed && (
        <p className="save-warning" role="alert">
          Your latest change could not be saved because browser storage is full. Photos take
          the most space, so try a smaller one.
        </p>
      )}

      <main className="content-grid">
        {activeTab === 'Home' && (
          <DashboardView
            itemCount={appState.wardrobe.length}
            lookCount={appState.looks.length}
            scenarioCoverage={scenarioCoverage}
            topLooks={topLooks}
            topWishlist={topWishlist}
            estimatedSpend={estimatedSpend}
          />
        )}

        {activeTab === 'Looks' && (
          <LooksView
            wardrobe={appState.wardrobe}
            scenarios={appState.scenarios}
            looks={appState.looks}
            wishlist={appState.wishlist}
            onAddLook={addLook}
            onUpdateLookStatus={updateLookStatus}
            onCreateWishlistIdea={createWishlistIdea}
          />
        )}

        {activeTab === 'Closet' && (
          <ClosetView
            wardrobe={appState.wardrobe}
            looks={appState.looks}
            onAddItem={addWardrobeItem}
            onToggleFavorite={toggleWardrobeFavorite}
            onToggleReplacement={toggleWardrobeReplacement}
          />
        )}

        {activeTab === 'Wishlist' && (
          <WishlistView
            wishlist={appState.wishlist}
            wishlistInsights={wishlistInsights}
            scenarios={appState.scenarios}
            looks={appState.looks}
            wardrobe={appState.wardrobe}
            onAddWishlistItem={addWishlistItem}
            onUpdateWishlistItem={updateWishlistItem}
            onRemoveWishlistItem={removeWishlistItem}
          />
        )}

        {activeTab === 'Insights' && (
          <InsightsView
            scenarioCoverage={scenarioCoverage}
            rankedGaps={rankedGaps}
            wishlistInsights={wishlistInsights}
            scenarios={appState.scenarios}
            estimatedSpend={estimatedSpend}
            onCreateWishlistIdea={createWishlistIdea}
          />
        )}
      </main>
    </div>
  )
}

export default App
