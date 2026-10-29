import { useMemo, useState, type FormEvent } from 'react'
import { getColorSwatch } from '../lib/color'
import { getLookSummary, itemMatchesLookFilters, singularCategory } from '../lib/looks'
import type { Category, Look, LookStatus, Scenario, Season, WardrobeItem, WishlistItem } from '../types'
import { lookStatuses, seasons } from '../types'

type LookDraft = {
  name: string
  scenarioId: string
  season: Season
  notes: string
  itemIds: string[]
  isPlanned: boolean
  rating: number
}

type LooksViewProps = {
  wardrobe: WardrobeItem[]
  scenarios: Scenario[]
  looks: Look[]
  wishlist: WishlistItem[]
  onAddLook: (draft: Omit<Look, 'id' | 'status' | 'missingCategories' | 'wishlistItemIds'>) => void
  onUpdateLookStatus: (lookId: string, status: LookStatus) => void
  onCreateWishlistIdea: (input: {
    title: string
    category: Category
    season: Season
    scenarioIds: string[]
    intendedLookIds: string[]
    intendedWithItemIds: string[]
    notes: string
  }) => void
}

const emptyDraft: LookDraft = {
  name: '',
  scenarioId: 'work',
  season: 'All-season',
  notes: '',
  itemIds: [],
  isPlanned: true,
  rating: 4,
}

export function LooksView({
  wardrobe,
  scenarios,
  looks,
  wishlist,
  onAddLook,
  onUpdateLookStatus,
  onCreateWishlistIdea,
}: LooksViewProps) {
  const [draft, setDraft] = useState<LookDraft>(emptyDraft)

  const activeScenario =
    scenarios.find((scenario) => scenario.id === draft.scenarioId) ?? scenarios[0]

  const filteredWardrobe = useMemo(
    () =>
      wardrobe.filter((item) => itemMatchesLookFilters(item, activeScenario, draft.season)),
    [activeScenario, draft.season, wardrobe],
  )

  // Picks stay in the draft when a scenario or season switch hides them, so switching
  // back restores them, but only the pieces still shown count and get saved.
  const visibleItemIds = useMemo(
    () => draft.itemIds.filter((id) => filteredWardrobe.some((item) => item.id === id)),
    [draft.itemIds, filteredWardrobe],
  )

  const draftLookSummary = useMemo(() => {
    const previewLook: Look = {
      id: 'draft',
      name: draft.name || 'Draft',
      scenarioId: draft.scenarioId,
      season: draft.season,
      notes: draft.notes,
      itemIds: visibleItemIds,
      isPlanned: draft.isPlanned,
      rating: draft.rating,
      status: 'Ready',
      missingCategories: [],
      wishlistItemIds: [],
    }

    return getLookSummary(previewLook, wardrobe, activeScenario)
  }, [activeScenario, draft, visibleItemIds, wardrobe])

  function toggleItem(itemId: string) {
    setDraft((current) => ({
      ...current,
      itemIds: current.itemIds.includes(itemId)
        ? current.itemIds.filter((id) => id !== itemId)
        : [...current.itemIds, itemId],
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onAddLook({
      name: draft.name.trim(),
      scenarioId: draft.scenarioId,
      season: draft.season,
      notes: draft.notes.trim(),
      itemIds: visibleItemIds,
      isPlanned: draft.isPlanned,
      rating: draft.rating,
    })
    setDraft(emptyDraft)
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Looks</p>
            <h2>Build a fit</h2>
          </div>
        </div>

        <div className="scenario-chip-row">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className={scenario.id === draft.scenarioId ? 'chip is-active' : 'chip'}
              aria-pressed={scenario.id === draft.scenarioId}
              onClick={() =>
                setDraft((current) => ({ ...current, scenarioId: scenario.id }))
              }
            >
              {scenario.name}
            </button>
          ))}
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Look name
            <input
              required
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Client dinner uniform"
            />
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
            Rating
            <select
              value={draft.rating}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  rating: Number(event.target.value),
                }))
              }
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <option key={rating} value={rating}>
                  {'★'.repeat(rating)}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={draft.isPlanned}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  isPlanned: event.target.checked,
                }))
              }
            />
            Planned look
          </label>
          <label className="form-span">
            Notes
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder={activeScenario.description}
            />
          </label>
          <div className="form-span">
            <div className="panel-subheader">
              <strong>Pick pieces</strong>
              <span>
                {draftLookSummary.completenessPercent}% complete ·{' '}
                {draftLookSummary.missingCategories.length === 0
                  ? 'ready to wear'
                  : `missing ${draftLookSummary.missingCategories.length}`}
              </span>
            </div>

            <div className="selection-grid">
              {filteredWardrobe.map((item) => {
                const selected = draft.itemIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={selected ? 'select-card is-selected' : 'select-card'}
                    aria-pressed={selected}
                    onClick={() => toggleItem(item.id)}
                  >
                    {item.image ? (
                      <img className="selection-image" src={item.image} alt={item.name} />
                    ) : (
                      <div className="selection-image selection-image-placeholder">
                        No photo
                      </div>
                    )}
                    <strong>{item.name}</strong>
                    <div className="swatch-row">
                      <span
                        className="color-swatch"
                        style={{ backgroundColor: getColorSwatch(item.color) }}
                        aria-hidden="true"
                      />
                      <span className="swatch-label">{item.color}</span>
                    </div>
                    <span>
                      {item.category} · {item.color}
                    </span>
                    <small>{item.dressCode}</small>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="form-span look-gap-preview">
            <strong>What this look still needs</strong>
            <div className="missing-piece-grid">
              {draftLookSummary.missingCategories.length === 0 ? (
                <span className="pill pill-good">Nothing missing</span>
              ) : (
                draftLookSummary.missingCategories.map((category, index) => (
                  <button
                    key={`${category}-${index}`}
                    type="button"
                    className="missing-piece-card"
                    onClick={() =>
                      onCreateWishlistIdea({
                        title: `${activeScenario.name} ${singularCategory(category)}`,
                        category,
                        season: draft.season,
                        scenarioIds: [draft.scenarioId],
                        intendedLookIds: [],
                        intendedWithItemIds: visibleItemIds,
                        notes: `Created from a draft ${activeScenario.name.toLowerCase()} look.`,
                      })
                    }
                  >
                    <span className="missing-piece-eyebrow">Missing now</span>
                    <strong>{singularCategory(category)}</strong>
                    <small>Add straight to wishlist</small>
                  </button>
                ))
              )}
            </div>
          </div>

          <button type="submit" className="primary-button full-width-button">
            Save look
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Saved looks</p>
            <h2>Scenario-ready outfits</h2>
          </div>
        </div>

        <div className="look-board-grid">
          {looks.map((look) => {
            const scenario = scenarios.find((entry) => entry.id === look.scenarioId)
            const summary = getLookSummary(look, wardrobe, scenario)
            const linkedWishlist = wishlist.filter((item) =>
              item.intendedLookIds.includes(look.id),
            )

            return (
              <article key={look.id} className="list-card look-card look-board-card">
                <div className="look-board-collage">
                  {summary.items.slice(0, 4).map((item) =>
                    item.image ? (
                      <img
                        key={item.id}
                        className="look-board-tile"
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <div
                        key={item.id}
                        className="look-board-tile look-board-swatch"
                        style={{ backgroundColor: getColorSwatch(item.color) }}
                        aria-hidden="true"
                      />
                    ),
                  )}
                </div>
                <div className="buy-card-header">
                  <div>
                    <strong>{look.name}</strong>
                    <p>
                      {scenario?.name ?? 'Scenario'} · {look.season}
                    </p>
                  </div>
                  <div className="badge-row">
                    <span className="pill pill-neutral">
                      {summary.completenessPercent}% complete
                    </span>
                    {look.isPlanned && <span className="pill pill-warn">Planned</span>}
                  </div>
                </div>

                <p>{look.notes}</p>

                <div className="look-piece-grid">
                  {summary.items.map((item) => (
                    <div key={item.id} className="look-piece-pill">
                      {item.image ? (
                        <img className="look-piece-thumb" src={item.image} alt={item.name} />
                      ) : (
                        <div className="look-piece-thumb look-piece-thumb-placeholder" />
                      )}
                      <span>{item.name}</span>
                      <div className="swatch-row">
                        <span
                          className="color-swatch"
                          style={{ backgroundColor: getColorSwatch(item.color) }}
                          aria-hidden="true"
                        />
                        <span className="swatch-label">{item.color}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="look-meta-grid">
                  <label>
                    Status
                    <select
                      value={look.status}
                      onChange={(event) =>
                        onUpdateLookStatus(look.id, event.target.value as LookStatus)
                      }
                    >
                      {lookStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <strong>Still needs</strong>
                    <div className="tag-row">
                      {summary.missingCategories.length === 0 ? (
                        <span className="pill pill-good">Complete</span>
                      ) : (
                        summary.missingCategories.map((category, index) => (
                          <button
                            key={`${look.id}-${category}-${index}`}
                            type="button"
                            className="chip"
                            onClick={() =>
                              onCreateWishlistIdea({
                                title: `${scenario?.name ?? 'Scenario'} ${singularCategory(category)}`,
                                category,
                                season: look.season,
                                scenarioIds: scenario ? [scenario.id] : [],
                                intendedLookIds: [look.id],
                                intendedWithItemIds: look.itemIds,
                                notes: `Created from the look "${look.name}".`,
                              })
                            }
                          >
                            {singularCategory(category)}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {linkedWishlist.length > 0 && (
                  <div>
                    <strong>Wishlist-backed</strong>
                    <div className="tag-row">
                      {linkedWishlist.map((item) => (
                        <span key={item.id} className="pill pill-neutral">
                          {item.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
