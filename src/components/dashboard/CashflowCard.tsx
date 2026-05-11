import { useMemo } from 'react'
import Card from '../ui/Card'
import { useFinanceStore } from '../../hooks/useFinanceStore'
import { monthlyFreeCashflow, rigidMonthlyExpenses, totalMonthlyIncome } from '../../utils/risk'
import { fmtWanFull } from '../../utils/format'

export default function CashflowCard() {
  const profile = useFinanceStore((s) => s.profile)

  const income = useMemo(() => totalMonthlyIncome(profile), [profile])
  const expenses = useMemo(() => rigidMonthlyExpenses(profile), [profile])
  const free = useMemo(() => monthlyFreeCashflow(profile), [profile])

  const barWidth = income > 0 ? Math.min((expenses / income) * 100, 100) : 0

  return (
    <Card title="每月现金流">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">月收入</span>
          <span className="font-semibold">{fmtWanFull(income)}</span>
        </div>

        <div className="relative h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${barWidth}%`,
              backgroundColor: barWidth > 80 ? 'var(--color-danger)' : barWidth > 60 ? 'var(--color-warning)' : 'var(--color-safe)',
            }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">刚性支出</span>
          <span className="font-semibold">{fmtWanFull(expenses)}</span>
        </div>

        <div className="flex justify-between pt-2 border-t border-[var(--color-border)] text-sm">
          <span className="font-medium">每月结余</span>
          <span className={`font-serif font-bold text-base ${free >= 0 ? 'text-[var(--color-safe)]' : 'text-[var(--color-danger)]'}`}>
            {fmtWanFull(free)}
          </span>
        </div>
      </div>
    </Card>
  )
}
