import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { getColorSwatch } from '../lib/color'
import { formatLookCount } from '../lib/insights'
import type { DressCode, Look, Season, WardrobeItem } from '../types'
import { categories, dressCodes, seasons } from '../types'

type WardrobeDraft = {
  name: string
  category: WardrobeItem['category']
  color: string
  season: Season
  qualityRating: number
  needsReplacing: boolean
  dressCode: DressCode
  formality: number
  favorite: boolean
  tags: string
  image?: string
}

type ClosetViewProps = {
  wardrobe: WardrobeItem[]
  looks: Look[]
  onAddItem: (draft: Omit<WardrobeItem, 'id' | 'tags'> & { tags: string[] }) => void
  onToggleFavorite: (itemId: string) => void
  onToggleReplacement: (itemId: string) => void
}

const emptyDraft: WardrobeDraft = {
  name: '',
  category: 'Tops',
  color: '',
  season: 'All-season',
  qualityRating: 4,
  needsReplacing: false,
  dressCode: 'Casual',
  formality: 2,
  favorite: false,
  tags: '',
  image: undefined,
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read image file'))
    reader.readAsDataURL(file)
  })
}

export function ClosetView({
  wardrobe,
  looks,
  onAddItem,
  onToggleFavorite,
  onToggleReplacement,
}: ClosetViewProps) {
  const [draft, setDraft] = useState<WardrobeDraft>(emptyDraft)
  const [seasonFilter, setSeasonFilter] = useState<Season | 'All'>('All')
  const [categoryFilter, setCategoryFilter] =
    useState<WardrobeItem['category'] | 'All'>('All')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const useCount = useMemo(() => {
    return looks.reduce<Record<string, number>>((counts, look) => {
      for (const itemId of look.itemIds) {
        counts[itemId] = (counts[itemId] ?? 0) + 1
      }

      return counts
    }, {})
  }, [looks])

  const filteredWardrobe = wardrobe.filter((item) => {
    const matchesSeason =
      seasonFilter === 'All' ||
      item.season === 'All-season' ||
      item.season === seasonFilter
    const matchesCategory =
      categoryFilter === 'All' || item.category === categoryFilter

    return matchesSeason && matchesCategory
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onAddItem({
      name: draft.name.trim(),
      category: draft.category,
      color: draft.color.trim(),
      season: draft.season,
      qualityRating: draft.qualityRating,
      needsReplacing: draft.needsReplacing,
      dressCode: draft.dressCode,
      formality: draft.formality,
      favorite: draft.favorite,
      tags: draft.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      image: draft.image,
    })

    setDraft(emptyDraft)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setDraft((current) => ({ ...current, image: undefined }))
      return
    }

    const image = await readFileAsDataUrl(file)
    setDraft((current) => ({ ...current, image }))
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Closet</p>
            <h2>Add a piece</h2>
          </div>
        </div>

        <form className="closet-composer" onSubmit={handleSubmit}>
          <div className="closet-photo-stage">
            <div className="photo-upload-panel">
              {draft.image ? (
                <img className="upload-preview" src={draft.image} alt="Piece preview" />
              ) : (
                <div
                  className="empty-photo color-fallback-stage"
                  style={{ backgroundColor: getColorSwatch(draft.color || 'black') }}
                >
                  <span>{draft.color || 'Add a color and photo'}</span>
                </div>
              )}
              <label>
                Photo
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    void handleImageChange(event)
                  }}
                />
              </label>
            </div>
          </div>

          <div className="closet-fields">
            <div className="form-grid">
              <label>
                Name
                <input
                  required
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Chocolate suede blazer"
                />
              </label>
              <label>
                Category
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      category: event.target.value as WardrobeItem['category'],
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
                Color
                <input
                  required
                  value={draft.color}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, color: event.target.value }))
                  }
                  placeholder="Chocolate"
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
                Dress code
                <select
                  value={draft.dressCode}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      dressCode: event.target.value as DressCode,
                    }))
                  }
                >
                  {dressCodes.map((dressCode) => (
                    <option key={dressCode} value={dressCode}>
                      {dressCode}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quality
                <select
                  value={draft.qualityRating}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      qualityRating: Number(event.target.value),
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
              <label>
                Formality
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={draft.formality}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      formality: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="form-span">
                Tags
                <input
                  value={draft.tags}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, tags: event.target.value }))
                  }
                  placeholder="work, elevated basics, travel"
                />
              </label>
            </div>

            <div className="composer-footer">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={draft.favorite}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      favorite: event.target.checked,
                    }))
                  }
                />
                Favorite piece
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={draft.needsReplacing}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      needsReplacing: event.target.checked,
                    }))
                  }
                />
                Needs replacing
              </label>
              <button type="submit" className="primary-button">
                Add to closet
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Styled inventory</p>
            <h2>Pieces you can build from</h2>
          </div>
          <div className="filter-row">
            <label className="inline-control">
              Season
              <select
                value={seasonFilter}
                onChange={(event) =>
                  setSeasonFilter(event.target.value as Season | 'All')
                }
              >
                <option value="All">All</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-control">
              Category
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as WardrobeItem['category'] | 'All')
                }
              >
                <option value="All">All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="card-grid">
          {filteredWardrobe.map((item) => (
            <article key={item.id} className="item-card">
              <div className="piece-visual">
                {item.image ? (
                  <img className="piece-image" src={item.image} alt={item.name} />
                ) : (
                  <div
                    className="empty-photo empty-photo-card color-fallback-stage"
                    style={{ backgroundColor: getColorSwatch(item.color) }}
                  >
                    <span>{item.color}</span>
                  </div>
                )}
              </div>
              <div className="card-topline">
                <div>
                  <strong>{item.name}</strong>
                  <div className="swatch-row">
                    <span
                      className="color-swatch"
                      style={{ backgroundColor: getColorSwatch(item.color) }}
                      aria-hidden="true"
                    />
                    <span className="swatch-label">{item.color}</span>
                  </div>
                </div>
                <div className="badge-row">
                  {item.favorite && <span className="pill pill-neutral">Favorite</span>}
                  {item.needsReplacing && (
                    <span className="pill pill-warn">Replace</span>
                  )}
                </div>
              </div>
              <p>
                {item.category} · {item.color} · {item.season}
              </p>
              <p>
                {item.dressCode} · Formality {item.formality}/5
              </p>
              <p>{'★'.repeat(item.qualityRating)}</p>
              <p>Used in {formatLookCount(useCount[item.id] ?? 0)}</p>
              <div className="tag-row">
                {item.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="button-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onToggleFavorite(item.id)}
                >
                  {item.favorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onToggleReplacement(item.id)}
                >
                  {item.needsReplacing ? 'Keep for now' : 'Mark to replace'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
