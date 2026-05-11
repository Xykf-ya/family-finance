interface ProgressBarProps {
  value: number // 0-100
  label?: string
  thresholds?: { safe: number; warning: number } // e.g. { safe: 50, warning: 70 }
}

export default function ProgressBar({ value, label, thresholds = { safe: 50, warning: 70 } }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const status = clampedValue <= thresholds.safe ? 'safe' : clampedValue <= thresholds.warning ? 'warning' : 'danger'

  const colors = {
    safe: 'var(--color-safe)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
          <span
            className="text-xs font-semibold"
            style={{ color: colors[status] }}
          >
            {clampedValue.toFixed(1)}%
          </span>
        </div>
      )}
      <div className="h-2 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: colors[status],
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
        <span style={{ color: colors.safe }}>安全</span>
        <span style={{ color: colors.warning }}>关注</span>
        <span style={{ color: colors.danger }}>危险</span>
      </div>
    </div>
  )
}
