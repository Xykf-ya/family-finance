import { useState, useEffect } from 'react'

interface NumberInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  unit?: string
  placeholder?: string
  hint?: string
  min?: number
  scale?: number
}

export default function NumberInput({
  label,
  value,
  onChange,
  unit = '万元',
  placeholder = '0',
  hint,
  min: _min,
  scale = 10000,
}: NumberInputProps) {
  const externalDisplay = scale && scale !== 1 ? value / scale : value
  const [text, setText] = useState(externalDisplay === 0 ? '' : String(externalDisplay))

  // Sync when external value changes (e.g. profile loaded from localStorage)
  useEffect(() => {
    const d = scale && scale !== 1 ? value / scale : value
    setText((prev) => {
      const prevNum = parseFloat(prev)
      if (prev === '' && d === 0) return ''
      if (Math.abs(prevNum - d) < 0.0001) return prev
      return d === 0 ? '' : String(d)
    })
  }, [value, scale])

  const handleChange = (raw: string) => {
    setText(raw)
    if (raw === '' || raw === '-') {
      onChange(0)
      return
    }
    const v = parseFloat(raw)
    if (!isNaN(v)) {
      onChange(scale && scale !== 1 ? Math.round(v * scale) : v)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[var(--color-text-muted)] font-medium">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-[var(--color-border)] py-2 pr-12 text-base font-sans text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] pointer-events-none">
          {unit}
        </span>
      </div>
      {hint && <span className="text-[10px] text-[var(--color-text-muted)]">{hint}</span>}
    </div>
  )
}
