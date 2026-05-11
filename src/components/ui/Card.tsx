import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
}

export default function Card({ children, className = '', title }: CardProps) {
  return (
    <div
      className={`bg-[var(--color-surface)] rounded-xl shadow-[0_2px_12px_rgba(61,50,38,0.06)] border border-[var(--color-border)] p-4 ${className}`}
    >
      {title && (
        <h3 className="font-serif text-[15px] font-semibold text-[var(--color-text)] mb-3 tracking-wide">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
