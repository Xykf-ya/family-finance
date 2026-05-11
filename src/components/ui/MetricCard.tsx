interface MetricCardProps {
  label: string
  value: string
  subtext?: string
  status?: 'safe' | 'warning' | 'danger' | 'neutral'
}

const statusColors = {
  safe: 'text-[var(--color-safe)]',
  warning: 'text-[var(--color-warning)]',
  danger: 'text-[var(--color-danger)]',
  neutral: 'text-[var(--color-text)]',
}

const statusDots = {
  safe: 'var(--color-safe)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  neutral: 'var(--color-text-muted)',
}

export default function MetricCard({ label, value, subtext, status = 'neutral' }: MetricCardProps) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2 h-2 rounded-full inline-block"
          style={{ backgroundColor: statusDots[status] }}
        />
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      </div>
      <span className={`text-xl font-serif font-bold ${statusColors[status]}`}>
        {value}
      </span>
      {subtext && (
        <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{subtext}</span>
      )}
    </div>
  )
}
