import { fmtWanFull } from '../../utils/format'

interface SafetyGaugeProps {
  safetyLine: number
  bankruptcyLine: number
  currentBorrowing: number
  maxBorrowing?: number
}

export default function SafetyGauge({
  safetyLine,
  bankruptcyLine,
  currentBorrowing,
  maxBorrowing,
}: SafetyGaugeProps) {
  const displayMax = maxBorrowing || bankruptcyLine * 1.3
  const safetyPct = (safetyLine / displayMax) * 100
  const bankruptcyPct = (bankruptcyLine / displayMax) * 100
  const currentPct = Math.min((currentBorrowing / displayMax) * 100, 100)

  const zone = currentBorrowing <= safetyLine ? 'safe' : currentBorrowing < bankruptcyLine ? 'warning' : 'danger'

  const zoneLabel = { safe: '安全区', warning: '警示区', danger: '破产区' }
  const zoneColor = {
    safe: 'var(--color-safe)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Gauge bar */}
      <div className="relative h-8 rounded-full overflow-hidden" style={{ background: `linear-gradient(to right, var(--color-safe), var(--color-warning) ${safetyPct}%, var(--color-warning) ${safetyPct}%, var(--color-danger) ${bankruptcyPct}%, var(--color-danger) ${bankruptcyPct}%, #e0d8c8)` }}>
        {/* Safety / warning / danger zones */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right,
              var(--color-safe) 0%, var(--color-safe) ${safetyPct}%,
              var(--color-warning) ${safetyPct}%, var(--color-warning) ${bankruptcyPct}%,
              var(--color-danger) ${bankruptcyPct}%, var(--color-danger) 100%)`,
            opacity: 0.2,
          }}
        />
        {/* Current position marker */}
        <div
          className="absolute top-0 h-full w-1 bg-white shadow-md rounded transition-all duration-500"
          style={{ left: `${currentPct}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>0</span>
        <span className="font-medium" style={{ color: 'var(--color-safe)' }}>
          {fmtWanFull(safetyLine)}
        </span>
        <span className="font-medium" style={{ color: 'var(--color-danger)' }}>
          {fmtWanFull(bankruptcyLine)}
        </span>
        <span>{fmtWanFull(displayMax)}</span>
      </div>

      {/* Zone indicator */}
      <div className="flex items-center gap-2 justify-center">
        <span
          className="w-3 h-3 rounded-full inline-block"
          style={{ backgroundColor: zoneColor[zone] }}
        />
        <span className="text-sm font-medium" style={{ color: zoneColor[zone] }}>
          当前处于{zoneLabel[zone]}
        </span>
      </div>
    </div>
  )
}
