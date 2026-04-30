import type { ScenarioCoverage } from '../types'

type ScenarioRadarChartProps = {
  coverage: ScenarioCoverage[]
}

export function ScenarioRadarChart({ coverage }: ScenarioRadarChartProps) {
  const size = 320
  const center = size / 2
  const radius = 110
  const levels = [25, 50, 75, 100]

  const points = coverage.map((entry, index) => {
    const angle = (Math.PI * 2 * index) / coverage.length - Math.PI / 2
    const valueRadius = (entry.coveragePercent / 100) * radius
    const labelRadius = radius + 30

    return {
      entry,
      x: center + Math.cos(angle) * valueRadius,
      y: center + Math.sin(angle) * valueRadius,
      axisX: center + Math.cos(angle) * radius,
      axisY: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * labelRadius,
      labelY: center + Math.sin(angle) * labelRadius,
    }
  })

  const polygonPoints = points.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <div className="radar-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="radar-chart" role="img" aria-label="Scenario coverage radar chart">
        {levels.map((level) => {
          const ringPoints = coverage
            .map((_, index) => {
              const angle = (Math.PI * 2 * index) / coverage.length - Math.PI / 2
              const ringRadius = (level / 100) * radius
              return `${center + Math.cos(angle) * ringRadius},${center + Math.sin(angle) * ringRadius}`
            })
            .join(' ')

          return <polygon key={level} points={ringPoints} className="radar-grid" />
        })}

        {points.map((point) => (
          <line
            key={point.entry.scenario.id}
            x1={center}
            y1={center}
            x2={point.axisX}
            y2={point.axisY}
            className="radar-axis"
          />
        ))}

        <polygon points={polygonPoints} className="radar-area" />
        <polyline points={polygonPoints} className="radar-line" />

        {points.map((point) => (
          <g key={point.entry.scenario.id}>
            <circle cx={point.x} cy={point.y} r="4" className="radar-dot" />
            <text x={point.labelX} y={point.labelY} className="radar-label" textAnchor="middle">
              {point.entry.scenario.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
