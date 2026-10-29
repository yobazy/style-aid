import { useMemo, useState, type FormEvent } from 'react'
import { formatCurrency, parsePrice } from '../lib/insights'
import { importProductFromUrl } from '../lib/productImport'
import type {
  Category,
  ImportedProductData,
  Look,
  Priority,
  Scenario,
  Season,
  WishlistInsight,
  WishlistItem,
  WishlistStatus,
  WardrobeItem,
} from '../types'
import { categories, priorities, seasons, wishlistStatuses } from '../types'

type WishlistDraft = {
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
  intendedLookIds: string[]
  intendedWithItemIds: string[]
}

type WishlistViewProps = {
  wishlist: WishlistItem[]
  wishlistInsights: WishlistInsight[]
  scenarios: Scenario[]
  looks: Look[]
  wardrobe: WardrobeItem[]
  onAddWishlistItem: (
    draft: Omit<WishlistItem, 'id' | 'isReplacement' | 'purchased'>,
  ) => void
  onUpdateWishlistItem: (itemId: string, patch: Partial<WishlistItem>) => void
  onRemoveWishlistItem: (itemId: string) => void
}

const emptyDraft: WishlistDraft = {
  title: '',
  category: 'Accessories',
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
  intendedLookIds: [],
  intendedWithItemIds: [],
}

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]
}

export function WishlistView({
  wishlist,
  wishlistInsights,
  scenarios,
  looks,
  wardrobe,
  onAddWishlistItem,
  onUpdateWishlistItem,
  onRemoveWishlistItem,
}: WishlistViewProps) {
  const [draft, setDraft] = useState<WishlistDraft>(emptyDraft)
  const [sortMode, setSortMode] = useState<'usefulness' | 'priority' | 'status'>(
    'usefulness',
  )
  const [importState, setImportState] = useState<{
    status: 'idle' | 'loading' | 'error' | 'success'
    message: string
  }>({ status: 'idle', message: '' })

  const insightMap = useMemo(
    () => new Map(wishlistInsights.map((entry) => [entry.item.id, entry])),
    [wishlistInsights],
  )

  const sortedWishlist = useMemo(() => {
    const scored = [...wishlist]

    return scored.sort((left, right) => {
      if (sortMode === 'usefulness') {
        return (
          (insightMap.get(right.id)?.usefulnessScore ?? 0) -
          (insightMap.get(left.id)?.usefulnessScore ?? 0)
        )
      }

      if (sortMode === 'priority') {
        return priorities.indexOf(left.priority) - priorities.indexOf(right.priority)
      }

      return wishlistStatuses.indexOf(left.status) - wishlistStatuses.indexOf(right.status)
    })
  }, [insightMap, sortMode, wishlist])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onAddWishlistItem({
      title: draft.title.trim(),
      category: draft.category,
      season: draft.season,
      image: draft.image,
      brand: draft.brand.trim(),
      retailer: draft.retailer.trim(),
      productUrl: draft.productUrl.trim(),
      targetPrice: draft.targetPrice.trim(),
      currentPrice: draft.currentPrice.trim(),
      priority: draft.priority,
      status: draft.status,
      notes: draft.notes.trim(),
      scenarioIds: draft.scenarioIds,
      intendedWithItemIds: draft.intendedWithItemIds,
      intendedLookIds: draft.intendedLookIds,
      linkedWardrobeItemId: undefined,
    })
    setDraft(emptyDraft)
    setImportState({ status: 'idle', message: '' })
  }

  function applyImportedProduct(imported: ImportedProductData) {
    setDraft((current) => ({
      ...current,
      title: imported.title || current.title,
      category: imported.category ?? current.category,
      image: imported.image || current.image,
      brand: imported.brand || current.brand,
      retailer: imported.retailer || current.retailer,
      productUrl: imported.productUrl || current.productUrl,
      currentPrice: imported.currentPrice || current.currentPrice,
    }))
  }

  async function handleImport() {
    if (!draft.productUrl.trim()) {
      setImportState({ status: 'error', message: 'Paste a product URL first.' })
      return
    }

    setImportState({ status: 'loading', message: 'Importing product details...' })

    try {
      const imported = await importProductFromUrl(draft.productUrl.trim())
      applyImportedProduct(imported)
      setImportState({ status: 'success', message: 'Product details imported.' })
    } catch (error) {
      setImportState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Could not import this link.',
      })
    }
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Wishlist</p>
            <h2>Add a product</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Item
            <input
              required
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Vintage-inspired shoulder bag"
            />
          </label>
          <label>
            Brand
            <input
              value={draft.brand}
              onChange={(event) =>
                setDraft((current) => ({ ...current, brand: event.target.value }))
              }
              placeholder="Staud"
            />
          </label>
          <label>
            Retailer
            <input
              value={draft.retailer}
              onChange={(event) =>
                setDraft((current) => ({ ...current, retailer: event.target.value }))
              }
              placeholder="Nordstrom"
            />
          </label>
          <label>
            Category
            <select
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  category: event.target.value as Category,
                }))
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Season
            <select
              value={draft.season}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  season: event.target.value as Season,
                }))
              }
            >
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={draft.priority}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  priority: event.target.value as Priority,
                }))
              }
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  status: event.target.value as WishlistStatus,
                }))
              }
            >
              {wishlistStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Target price
            <input
              value={draft.targetPrice}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  targetPrice: event.target.value,
                }))
              }
              placeholder="250"
            />
          </label>
          <label>
            Current price
            <input
              value={draft.currentPrice}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  currentPrice: event.target.value,
                }))
              }
              placeholder="295"
            />
          </label>
          <label className="form-span">
            Product URL
            <input
              value={draft.productUrl}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  productUrl: event.target.value,
                }))
              }
              placeholder="https://..."
            />
          </label>
          <div className="form-span import-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void handleImport()
              }}
              disabled={importState.status === 'loading'}
            >
              {importState.status === 'loading' ? 'Importing...' : 'Import from link'}
            </button>
            {importState.message && (
              <span
                className={
                  importState.status === 'error'
                    ? 'helper-text helper-text-error'
                    : 'helper-text'
                }
              >
                {importState.message}
              </span>
            )}
          </div>
          <div className="form-span">
            {draft.image ? (
              <img
                className="wishlist-import-preview"
                src={draft.image}
                alt={draft.title || 'Imported product preview'}
              />
            ) : (
              <div className="empty-photo wishlist-import-placeholder">
                Import a product link to pull in its image and basic details.
              </div>
            )}
          </div>
          <label className="form-span">
            Notes
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Why this belongs in the wardrobe."
            />
          </label>

          <div className="form-span chooser-grid">
            <div>
              <strong>Scenarios</strong>
              <div className="tag-row">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    className={
                      draft.scenarioIds.includes(scenario.id) ? 'chip is-active' : 'chip'
                    }
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        scenarioIds: toggleValue(current.scenarioIds, scenario.id),
                      }))
                    }
                  >
                    {scenario.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <strong>Intended looks</strong>
              <div className="tag-row">
                {looks.map((look) => (
                  <button
                    key={look.id}
                    type="button"
                    className={
                      draft.intendedLookIds.includes(look.id) ? 'chip is-active' : 'chip'
                    }
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        intendedLookIds: toggleValue(current.intendedLookIds, look.id),
                      }))
                    }
                  >
                    {look.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <strong>Can style with</strong>
              <div className="tag-row">
                {wardrobe.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      draft.intendedWithItemIds.includes(item.id) ? 'chip is-active' : 'chip'
                    }
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        intendedWithItemIds: toggleValue(
                          current.intendedWithItemIds,
                          item.id,
                        ),
                      }))
                    }
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="primary-button full-width-button">
            Add to wishlist
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Prioritized wishlist</p>
            <h2>What is actually worth buying</h2>
          </div>
          <label className="inline-control">
            Sort by
            <select
              value={sortMode}
              onChange={(event) =>
                setSortMode(event.target.value as 'usefulness' | 'priority' | 'status')
              }
            >
              <option value="usefulness">Usefulness</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </label>
        </div>

        <div className="stack">
          {sortedWishlist.map((item) => {
            const insight = insightMap.get(item.id)
            const linkedLooks = looks.filter((look) =>
              item.intendedLookIds.includes(look.id),
            )
            const linkedPieces = wardrobe.filter((wardrobeItem) =>
              item.intendedWithItemIds.includes(wardrobeItem.id),
            )

            return (
              <article key={item.id} className="list-card buy-card">
                {item.image && (
                  <img className="wishlist-card-image" src={item.image} alt={item.title} />
                )}
                <div className="buy-card-header">
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {[item.brand, item.retailer].filter(Boolean).join(' · ') || item.category}
                    </p>
                  </div>
                  <div className="badge-row">
                    <span className="pill pill-neutral">{item.priority}</span>
                    <span className="pill pill-neutral">{item.status}</span>
                    {item.isReplacement && <span className="pill pill-warn">Replacement</span>}
                  </div>
                </div>

                <div className="buy-card-fields">
                  <label>
                    Priority
                    <select
                      value={item.priority}
                      onChange={(event) =>
                        onUpdateWishlistItem(item.id, {
                          priority: event.target.value as Priority,
                        })
                      }
                    >
                      {priorities.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select
                      value={item.status}
                      onChange={(event) =>
                        onUpdateWishlistItem(item.id, {
                          status: event.target.value as WishlistStatus,
                          purchased: event.target.value === 'Bought',
                        })
                      }
                    >
                      {wishlistStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Current price
                    <input
                      value={item.currentPrice}
                      onChange={(event) =>
                        onUpdateWishlistItem(item.id, {
                          currentPrice: event.target.value,
                        })
                      }
                      placeholder="Current price"
                    />
                  </label>
                </div>

                <p>{item.notes}</p>

                <div className="meta-row">
                  <span>
                    Est. spend {formatCurrency(parsePrice(item.currentPrice || item.targetPrice))}
                  </span>
                  <span>Usefulness {insight?.usefulnessScore ?? 0}</span>
                  <span>Unlocks {insight?.unlockedLookCount ?? 0} looks</span>
                  {insight?.costPerLook !== null && insight?.costPerLook !== undefined && (
                    <span>{formatCurrency(insight.costPerLook)}/look</span>
                  )}
                </div>

                <div>
                  <strong>Can style with</strong>
                  <div className="tag-row">
                    {linkedPieces.map((wardrobeItem) => (
                      <span key={wardrobeItem.id} className="chip">
                        {wardrobeItem.name}
                      </span>
                    ))}
                    {linkedLooks.map((look) => (
                      <span key={look.id} className="chip">
                        {look.name}
                      </span>
                    ))}
                    {linkedPieces.length === 0 && linkedLooks.length === 0 && (
                      <span className="pill pill-neutral">General want</span>
                    )}
                  </div>
                </div>

                <div className="buy-card-actions">
                  {item.productUrl ? (
                    <a className="ghost-button button-link" href={item.productUrl} target="_blank" rel="noreferrer">
                      Open link
                    </a>
                  ) : (
                    <span className="helper-text">No product link yet</span>
                  )}
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onRemoveWishlistItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
