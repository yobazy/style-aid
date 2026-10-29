import { ScenarioRadarChart } from './ScenarioRadarChart'
import { formatCurrency, getTopWishlistInsights } from '../lib/insights'
import { singularCategory } from '../lib/looks'
import type { Category, RankedGap, Scenario, ScenarioCoverage, WishlistInsight } from '../types'

type InsightsViewProps = {
  scenarioCoverage: ScenarioCoverage[]
  rankedGaps: RankedGap[]
  wishlistInsights: WishlistInsight[]
  scenarios: Scenario[]
  estimatedSpend: number
  onCreateWishlistIdea: (input: {
    title: string
    category: Category
    season: 'All-season'
    scenarioIds: string[]
    intendedLookIds: string[]
    intendedWithItemIds: string[]
    notes: string
  }) => void
}

export function InsightsView({
  scenarioCoverage,
  rankedGaps,
  wishlistInsights,
  scenarios,
  estimatedSpend,
  onCreateWishlistIdea,
}: InsightsViewProps) {
  const topWishlist = getTopWishlistInsights(wishlistInsights, 5)

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Insights</p>
            <h2>Coverage by scenario</h2>
          </div>
        </div>

        <div className="insight-hero-grid">
          <ScenarioRadarChart coverage={scenarioCoverage} />
          <div className="scenario-coverage-grid">
            {scenarioCoverage.map((entry) => (
              <article key={entry.scenario.id} className="score-card">
                <span>{entry.scenario.name}</span>
                <strong>{entry.coveragePercent}%</strong>
                <p>
                  {entry.completeLooks} complete of {entry.plannedLooks} planned
                </p>
                <div className="progress-track" aria-hidden="true">
                  <div
                    className="progress-fill"
                    style={{ width: `${entry.coveragePercent}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel two-column-panel">
        <div>
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Top missing pieces</p>
              <h2>What is holding looks back</h2>
            </div>
          </div>

          <div className="stack">
            {rankedGaps.slice(0, 6).map((gap) => {
              const scenario = scenarios.find((entry) => entry.id === gap.scenarioId)

              return (
                <article key={`${gap.scenarioId}-${gap.category}`} className="list-card">
                  <div className="card-topline">
                    <strong>{scenario ? scenario.name : 'Closet upkeep'}</strong>
                    <span className="pill pill-warn">Score {gap.score}</span>
                  </div>
                  <p>{gap.reason}</p>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      onCreateWishlistIdea({
                        title: `${scenario?.name ?? 'Core'} ${singularCategory(gap.category)}`,
                        category: gap.category,
                        season: 'All-season',
                        scenarioIds: gap.scenarioId ? [gap.scenarioId] : [],
                        intendedLookIds: gap.affectedLookIds,
                        intendedWithItemIds: [],
                        notes: gap.reason,
                      })
                    }
                  >
                    Add to wishlist
                  </button>
                </article>
              )
            })}
          </div>
        </div>

        <div>
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Wishlist ROI</p>
              <h2>Best next spend</h2>
            </div>
          </div>

          <div className="stack compact-stack">
            <article className="mini-metric">
              <span>Total estimated spend</span>
              <strong>{formatCurrency(estimatedSpend)}</strong>
            </article>
            {topWishlist.map(({ item, usefulnessScore, unlockedLookCount, costPerLook }) => (
              <article key={item.id} className="mini-metric">
                <span>{item.title}</span>
                <strong>{usefulnessScore}</strong>
                <p>
                  {unlockedLookCount} looks · {item.priority}
                </p>
                {costPerLook !== null && <p>{formatCurrency(costPerLook)}/look</p>}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
