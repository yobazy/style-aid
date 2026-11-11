import { getColorSwatch } from '../lib/color'
import type { Look, LookSummary, ScenarioCoverage, WishlistInsight } from '../types'
import { formatCurrency, formatLookCount } from '../lib/insights'

type LookCardData = {
  look: Look
  scenarioName: string
  summary: LookSummary
}

type DashboardViewProps = {
  itemCount: number
  lookCount: number
  scenarioCoverage: ScenarioCoverage[]
  topLooks: LookCardData[]
  topWishlist: WishlistInsight[]
  estimatedSpend: number
}

export function DashboardView({
  itemCount,
  lookCount,
  scenarioCoverage,
  topLooks,
  topWishlist,
  estimatedSpend,
}: DashboardViewProps) {
  return (
    <>
      <section className="hero hero-home">
        <div>
          <p className="eyebrow">Style Aid</p>
          <h1>Build fits around real scenarios, not random inventory.</h1>
          <p className="hero-copy">
            Save looks for work, nights out, weekends, and travel, then wishlist
            smarter because every purchase is tied to an outfit.
          </p>
        </div>

        <div className="hero-stats">
          <article className="stat-card">
            <span>Closet pieces</span>
            <strong>{itemCount}</strong>
          </article>
          <article className="stat-card">
            <span>Saved looks</span>
            <strong>{lookCount}</strong>
          </article>
          <article className="stat-card">
            <span>Wishlist spend</span>
            <strong>{formatCurrency(estimatedSpend)}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Scenario coverage</p>
            <h2>How ready your lifestyle is</h2>
          </div>
        </div>

        <div className="scenario-coverage-grid">
          {scenarioCoverage.map((entry) => (
            <article key={entry.scenario.id} className="score-card scenario-card">
              <div
                className="progress-ring"
                style={{ ['--progress' as string]: `${entry.coveragePercent}%` }}
                aria-hidden="true"
              >
                <div className="progress-ring-inner">
                  <strong>{entry.coveragePercent}%</strong>
                  <span>{formatLookCount(entry.plannedLooks)}</span>
                </div>
              </div>
              <div>
                <span>{entry.scenario.name}</span>
                <p>
                  {entry.completeLooks} complete · strongest look {entry.strongestLookPercent}%
                </p>
              </div>
              <div className="progress-track" aria-hidden="true">
                <div
                  className="progress-fill"
                  style={{ width: `${entry.averageCompleteness}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel two-column-panel">
        <div>
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Best looks</p>
              <h2>Fits already working for you</h2>
            </div>
          </div>

          <div className="home-look-grid">
            {topLooks.map(({ look, scenarioName, summary }) => (
              <article key={look.id} className="list-card home-look-card">
                <div className="look-collage">
                  {summary.items.slice(0, 4).map((item) =>
                    item.image ? (
                      <img
                        key={item.id}
                        className="look-collage-tile"
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <div
                        key={item.id}
                        className="look-collage-tile look-collage-swatch"
                        style={{ backgroundColor: getColorSwatch(item.color) }}
                        aria-hidden="true"
                      />
                    ),
                  )}
                </div>
                <div className="card-topline">
                  <strong>{look.name}</strong>
                  <span className="pill pill-neutral">{scenarioName}</span>
                </div>
                <p>{look.notes}</p>
                <div className="meta-row">
                  <span>{look.season}</span>
                  <span>{summary.completenessPercent}% complete</span>
                  <span>{'★'.repeat(look.rating)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Wishlist with payoff</p>
              <h2>Most useful next buys</h2>
            </div>
          </div>

          <div className="stack">
            {topWishlist.map(({ item, usefulnessScore, unlockedLookCount }) => (
              <article key={item.id} className="mini-metric">
                <span>{item.title}</span>
                <strong>{usefulnessScore}</strong>
                <p>
                  Helps {formatLookCount(unlockedLookCount)} · {item.status}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
