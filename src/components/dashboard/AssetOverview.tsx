import Card from '../ui/Card'
import MetricCard from '../ui/MetricCard'
import { useFinanceStore } from '../../hooks/useFinanceStore'
import { netWorth, rigidMonthlyExpenses, totalMonthlyIncome, monthlyFreeCashflow, assetLiabilityRatio, emergencyReserveTarget, emergencyReserveCurrent, totalAssets, totalLiabilities } from '../../utils/risk'
import { fmtWanFull } from '../../utils/format'
import { useMemo } from 'react'

export default function AssetOverview() {
  const profile = useFinanceStore((s) => s.profile)

  const nw = useMemo(() => netWorth(profile), [profile])
  const mcf = useMemo(() => monthlyFreeCashflow(profile), [profile])
  const ratio = useMemo(() => assetLiabilityRatio(profile), [profile])
  const emergencyTarget = useMemo(() => emergencyReserveTarget(profile), [profile])
  const emergencyCurr = useMemo(() => emergencyReserveCurrent(profile), [profile])

  const cfStatus = mcf > 5000 ? 'safe' : mcf > 0 ? 'warning' : 'danger'
  const ratioStatus = ratio < 50 ? 'safe' : ratio < 70 ? 'warning' : 'danger'

  return (
    <div className="flex flex-col gap-3">
      {/* Top 3 key metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="col-span-3 sm:col-span-1">
          <MetricCard
            label="家庭净资产"
            value={`${fmtWanFull(nw)}`}
            status={nw >= 0 ? 'safe' : 'danger'}
          />
        </Card>
        <Card>
          <MetricCard
            label="月度自由现金流"
            value={`${fmtWanFull(mcf)}`}
            status={cfStatus}
            subtext={mcf < 0 ? '入不敷出' : undefined}
          />
        </Card>
        <Card>
          <MetricCard
            label="资产负债率"
            value={`${ratio.toFixed(1)}%`}
            status={ratioStatus}
            subtext={ratio > 70 ? '负债偏高' : ratio > 50 ? '适当关注' : '健康'}
          />
        </Card>
      </div>

      {/* Income / Expense summary */}
      <Card title="收支概况">
        <div className="flex justify-between py-2 border-b border-[var(--color-border)] text-sm">
          <span className="text-[var(--color-text-muted)]">月收入合计</span>
          <span className="font-semibold text-[var(--color-safe)]">
            {fmtWanFull(totalMonthlyIncome(profile))}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-[var(--color-border)] text-sm">
          <span className="text-[var(--color-text-muted)]">月刚性支出</span>
          <span className="font-semibold text-[var(--color-danger)]">
            {fmtWanFull(rigidMonthlyExpenses(profile))}
          </span>
        </div>
        <div className="flex justify-between py-2 text-sm">
          <span className="text-[var(--color-text-muted)]">应急储备金</span>
          <span className="font-semibold">
            {fmtWanFull(emergencyCurr)} / {fmtWanFull(emergencyTarget)}
          </span>
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)] text-right -mt-1">
          = {fmtWanFull(rigidMonthlyExpenses(profile))} × {profile.settings.emergencyMonths} 个月
          {profile.settings.emergencyExtra > 0 ? ` + ${fmtWanFull(profile.settings.emergencyExtra)}（风险应对金）` : ''}
        </div>
      </Card>

      {/* Asset / Liability breakdown */}
      <Card title="资产与负债">
        <div className="mb-2">
          <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">流动资产</span>
          <div className="flex justify-between py-1.5 text-sm">
            <span className="text-[var(--color-text-muted)] pl-2">存款/理财</span>
            <span>{fmtWanFull(profile.assets.savings)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-sm border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-muted)] pl-2">股票持仓</span>
            <span>{fmtWanFull(profile.assets.stockPosition)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-sm font-semibold">
            <span className="pl-2">流动资产小计</span>
            <span>{fmtWanFull(profile.assets.savings + profile.assets.stockPosition)}</span>
          </div>
        </div>

        <div className="mb-2 pt-1">
          <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">固定资产</span>
          <div className="flex justify-between py-1.5 text-sm">
            <span className="text-[var(--color-text-muted)] pl-2">房产估值</span>
            <span>{fmtWanFull(profile.assets.houseValue)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-sm border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-muted)] pl-2">其他固定资产</span>
            <span>{fmtWanFull(profile.assets.otherFixedAssets)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-sm font-semibold">
            <span className="pl-2">固定资产小计</span>
            <span>{fmtWanFull(profile.assets.houseValue + profile.assets.otherFixedAssets)}</span>
          </div>
        </div>

        <div className="flex justify-between py-2 text-sm font-serif font-bold border-t border-[var(--color-border)]">
          <span>总资产</span>
          <span>{fmtWanFull(totalAssets(profile))}</span>
        </div>
        <div className="flex justify-between py-2 text-sm">
          <span className="text-[var(--color-text-muted)]">总负债（剩余本金）</span>
          <span className="font-semibold">{fmtWanFull(totalLiabilities(profile))}</span>
        </div>
      </Card>
    </div>
  )
}
