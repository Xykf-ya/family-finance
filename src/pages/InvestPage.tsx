import { useState, useMemo } from 'react'
import Card from '../components/ui/Card'
import NumberInput from '../components/ui/NumberInput'
import { useFinanceStore } from '../hooks/useFinanceStore'
import { calculateThreeLines, calculateRiskDetails, totalMonthlyIncome, totalMonthlyExpenses, totalMonthlyLoanPayments, emergencyReserveTarget, emergencyReserveCurrent } from '../utils/risk'
import { allocateProfit, calculateLossWarning } from '../utils/profit'
import { fmtWanFull } from '../utils/format'
import type { FamilyFinanceProfile, ThreeLines, RiskDetails, ProfitAllocation, LossWarning } from '../types/finance'

export default function InvestPage() {
  const { profile, updateAssets, updateStockLoan } = useFinanceStore()
  const [todayProfit, setTodayProfit] = useState(0)
  const [executed, setExecuted] = useState(false)

  const lines: ThreeLines = useMemo(() => calculateThreeLines(profile), [profile])
  const details: RiskDetails = useMemo(() => calculateRiskDetails(profile), [profile])
  const allocation: ProfitAllocation = useMemo(() => allocateProfit(profile, todayProfit), [profile, todayProfit])
  const lossWarning: LossWarning = useMemo(() => calculateLossWarning(profile), [profile])

  const I = totalMonthlyIncome(profile)
  const E = totalMonthlyExpenses(profile)
  const P = totalMonthlyLoanPayments(profile) - profile.stockLoan.monthlyPayment
  const D = profile.assets.savings
  const reserveTarget = emergencyReserveTarget(profile)
  const reserveCurr = emergencyReserveCurrent(profile)

  const handleExecute = () => {
    if (allocation.toRepay + allocation.toSave <= 0) return
    updateStockLoan('balance', Math.max(0, profile.stockLoan.balance - allocation.toRepay))
    updateAssets('savings', profile.assets.savings + allocation.toSave)
    updateAssets('stockPosition', Math.max(0, profile.assets.stockPosition - allocation.toRepay - allocation.toSave))
    setExecuted(true)
    setTodayProfit(0)
    setTimeout(() => setExecuted(false), 4000)
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <header className="pt-2 pb-1">
        <h1 className="font-serif text-2xl font-bold text-[var(--color-text)]">
          投资健康
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          把看不见的风险算出来，做理性的家庭投资
        </p>
      </header>

      {/* ① 当前财务概况 */}
      <Card title="当前财务概况">
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          以下数据来自"概览"页，如需修改请返回概览页调整。
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          <span className="text-[var(--color-text-muted)]">月税后收入</span>
          <span className="text-right font-medium">{fmtWanFull(I)}</span>
          <span className="text-[var(--color-text-muted)]">月生活支出</span>
          <span className="text-right font-medium">{fmtWanFull(E)}</span>
          <span className="text-[var(--color-text-muted)]">房贷车贷月供</span>
          <span className="text-right font-medium">{fmtWanFull(P)}</span>
          <span className="text-[var(--color-text-muted)]">炒股贷款月供</span>
          <span className="text-right font-medium">{fmtWanFull(profile.stockLoan.monthlyPayment)}</span>
          <span className="text-[var(--color-text-muted)]">存款总额</span>
          <span className="text-right font-medium">{fmtWanFull(D)}</span>
          <span className="text-[var(--color-text-muted)]">应急储备金目标</span>
          <span className="text-right font-medium">{fmtWanFull(reserveTarget)}</span>
          <span className="text-[var(--color-text-muted)]">应急储备金当前</span>
          <span className={`text-right font-medium ${reserveCurr < reserveTarget ? 'text-[var(--color-warning)]' : 'text-[var(--color-safe)]'}`}>
            {fmtWanFull(reserveCurr)}
          </span>
        </div>
      </Card>

      {/* ② 持仓与贷款 */}
      <Card title="持仓与贷款">
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="炒股贷款余额"
            value={profile.stockLoan.balance}
            onChange={(v) => updateStockLoan('balance', v)}
          />
          <NumberInput
            label="年利率"
            value={profile.stockLoan.annualRate}
            onChange={(v) => updateStockLoan('annualRate', v)}
            unit="%"
            scale={1}
          />
          <NumberInput
            label="月还款额"
            value={profile.stockLoan.monthlyPayment}
            onChange={(v) => updateStockLoan('monthlyPayment', v)}
          />
          <NumberInput
            label="股票当前市值"
            value={profile.assets.stockPosition}
            onChange={(v) => updateAssets('stockPosition', v)}
          />
        </div>
      </Card>

      {/* ③ 今日盈亏输入 */}
      <Card title="今日盈亏">
        <NumberInput
          label="今日盈亏金额"
          value={todayProfit}
          onChange={(v) => { setTodayProfit(v); setExecuted(false) }}
          hint="正数=盈利，负数=亏损"
        />
      </Card>

      {/* ④ 风险区间 */}
      <Card title="风险区间">
        <RiskZone lines={lines} profile={profile} />
      </Card>

      {/* ⑤ 盈利分配 / 亏损警告 */}
      <Card title={todayProfit > 0 ? '盈利分配建议' : todayProfit < 0 ? '风险提示' : '当日无盈亏'}>
        {todayProfit > 0 ? (
          <ProfitView allocation={allocation} onExecute={handleExecute} executed={executed} />
        ) : todayProfit < 0 ? (
          <LossView loss={lossWarning} />
        ) : (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
            今日无盈亏，当前风险区间见上方。
          </p>
        )}
      </Card>

      {/* ⑥ 风险评估细节 */}
      <Card title="风险评估细节">
        <RiskDetailsPanel details={details} />
      </Card>
    </div>
  )
}

// ─── ④ Risk Zone ──────────────────────────────────────────

function RiskZone({ lines, profile }: { lines: ThreeLines; profile: FamilyFinanceProfile }) {
  const I = totalMonthlyIncome(profile)
  const E = totalMonthlyExpenses(profile)
  const P = totalMonthlyLoanPayments(profile) - profile.stockLoan.monthlyPayment
  const Q = profile.stockLoan.monthlyPayment
  const D = profile.assets.savings
  const B = profile.stockLoan.balance
  const S = profile.assets.stockPosition
  const netMonthly = I - E - P - Q

  const V6 = 6 * netMonthly + D + 0.2 * S - B
  const V2 = 2 * netMonthly + D + 0.2 * S - B

  const zoneColor = lines.zone === 'safe' ? 'var(--color-safe)'
    : lines.zone === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)'

  const wanStr = (v: number) => (v / 10000).toFixed(2) + ' 万'

  return (
    <div className="flex flex-col gap-4">
      {/* Zone badge */}
      <div className="flex items-center justify-center gap-2 py-1">
        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: zoneColor }} />
        <span className="text-lg font-bold" style={{ color: zoneColor }}>
          {lines.zone === 'safe' ? '安全区' : lines.zone === 'warning' ? '警戒区' : '危险区'}
        </span>
      </div>

      {/* Buffer values */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-[var(--color-border)]/50 rounded-lg p-3">
          <div className="text-xs text-[var(--color-text-muted)]">6 个月缓冲资金</div>
          <div className={`font-serif text-xl font-bold mt-1 ${V6 >= 100000 ? 'text-[var(--color-safe)]' : V6 >= 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}>
            {wanStr(V6)}
          </div>
        </div>
        <div className="bg-[var(--color-border)]/50 rounded-lg p-3">
          <div className="text-xs text-[var(--color-text-muted)]">2 个月缓冲资金</div>
          <div className={`font-serif text-xl font-bold mt-1 ${V2 >= 0 ? 'text-[var(--color-safe)]' : 'text-[var(--color-danger)]'}`}>
            {wanStr(V2)}
          </div>
        </div>
      </div>

      {/* Distance to boundaries */}
      <div className="text-xs text-[var(--color-text-muted)] leading-relaxed space-y-1">
        {lines.zone === 'safe' && (
          <p>距离警戒区还有 <b className="text-[var(--color-safe)]">{wanStr(V6 - 100000)}</b> 的缓冲空间。</p>
        )}
        {lines.zone === 'warning' && (
          <p>距离安全区还差 <b className="text-[var(--color-warning)]">{wanStr(100000 - V6)}</b>；距离危险区还有 <b className="text-[var(--color-warning)]">{wanStr(V2)}</b>。</p>
        )}
        {lines.zone === 'danger' && (
          <p className="text-[var(--color-danger)]">缓冲资金已转负，需补 <b>{wanStr(Math.abs(V2))}</b> 才能回到警戒线上方。</p>
        )}
      </div>

      {/* Three lines reference */}
      <div className="border-t border-[var(--color-border)] pt-3">
        <p className="text-xs text-[var(--color-text-muted)] mb-2">三条线参考（在当前条件下达到各边界的股票市值）</p>
        <div className="flex justify-between text-xs text-center">
          <div>
            <div className="text-[var(--color-safe)] font-semibold">安全线</div>
            <div className="font-medium">{fmtWanFull(lines.safetyLine)}</div>
          </div>
          <div>
            <div className="text-[var(--color-warning)] font-semibold">警戒线</div>
            <div className="font-medium">{fmtWanFull(lines.warningLine)}</div>
          </div>
          <div>
            <div className="text-[var(--color-danger)] font-semibold">破产线</div>
            <div className="font-medium">{fmtWanFull(lines.bankruptcyLine)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ⑤ Profit View ────────────────────────────────────────

function ProfitView({ allocation, onExecute, executed }: { allocation: ProfitAllocation; onExecute: () => void; executed: boolean }) {
  const buckets = [
    { label: '还贷', amount: allocation.toRepay, color: 'var(--color-warning)' },
    { label: '继续炒股', amount: allocation.toInvest, color: 'var(--color-accent)' },
    { label: '储蓄/零花', amount: allocation.toSave, color: 'var(--color-safe)' },
  ]
  const total = allocation.toRepay + allocation.toInvest + allocation.toSave
  const maxAmt = Math.max(...buckets.map(b => b.amount), 1)

  return (
    <div className="flex flex-col gap-3">
      {buckets.map(b => (
        <div key={b.label}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">{b.label}</span>
            <span className="text-sm font-serif font-bold" style={{ color: b.color }}>
              {fmtWanFull(b.amount)}{total > 0 ? `（${((b.amount / total) * 100).toFixed(0)}%）` : ''}
            </span>
          </div>
          <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(b.amount / maxAmt) * 100}%`, backgroundColor: b.color }} />
          </div>
        </div>
      ))}

      {/* 一句话结论 */}
      <div className="rounded-lg p-3 bg-[var(--color-border)]/50 text-sm text-[var(--color-text)] leading-relaxed">
        {allocation.conclusion}
      </div>

      {/* 确认执行 */}
      {total > 0 && (
        <button
          onClick={onExecute}
          disabled={executed}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
            executed
              ? 'bg-[var(--color-safe)] text-white'
              : 'bg-[var(--color-text)] text-[var(--color-bg)] active:opacity-80'
          }`}
        >
          {executed ? '已执行 ✓ 贷款余额与存款已更新' : '确认执行：从股票账户提现分配'}
        </button>
      )}
    </div>
  )
}

// ─── ⑤ Loss View ──────────────────────────────────────────

function LossView({ loss }: { loss: LossWarning }) {
  const zoneColor = loss.zone === 'safe' ? 'var(--color-safe)'
    : loss.zone === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: zoneColor }} />
        <span className="text-sm font-medium" style={{ color: zoneColor }}>
          {loss.zone === 'danger' ? '⚠ 危险 — 立即降低风险' : loss.zone === 'warning' ? '⚡ 注意 — 建议减仓' : '✓ 安全 — 保持观望'}
        </span>
      </div>

      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
        亏损情况下<strong>不建议补仓</strong>，追加资金会进一步扩大风险敞口。
      </p>

      {loss.zone !== 'safe' && (
        <div className="rounded-lg p-3 border border-[var(--color-warning)] bg-[var(--color-warning)]/5 text-sm">
          <p className="font-medium text-[var(--color-text)]">
            建议减仓还款 {fmtWanFull(loss.suggestedRepayment)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            将缓冲资金恢复至安全区（10 万元以上）
          </p>
        </div>
      )}

      <div className="rounded-lg p-3 bg-[var(--color-border)]/50 text-sm text-[var(--color-text)] leading-relaxed">
        {loss.conclusion}
      </div>
    </div>
  )
}

// ─── ⑥ Risk Details ───────────────────────────────────────

function RiskDetailsPanel({ details }: { details: RiskDetails }) {
  const statusColor = (s: 'safe' | 'warning' | 'danger') =>
    s === 'safe' ? 'var(--color-safe)' : s === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)'

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between py-1.5 border-b border-[var(--color-border)]">
        <span className="text-[var(--color-text-muted)]">月还款/月收入</span>
        <span className="font-semibold" style={{ color: statusColor(details.loanToIncomeStatus) }}>
          {details.loanToIncomeRatio.toFixed(1)}%
        </span>
      </div>
      {details.loanToIncomeRatio > 30 && (
        <p className={`text-[10px] ${details.loanToIncomeRatio > 40 ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'} text-right -mt-1`}>
          {details.loanToIncomeRatio > 40 ? '月供压力过高，需立即降低' : '月供压力偏大'}
        </p>
      )}

      <div className="flex justify-between py-1.5 border-b border-[var(--color-border)]">
        <span className="text-[var(--color-text-muted)]">存款可支撑月数（股票归零）</span>
        <span className="font-semibold" style={{ color: statusColor(details.survivalStatus) }}>
          {details.survivalMonths >= 999 ? '∞' : details.survivalMonths.toFixed(1) + ' 个月'}
        </span>
      </div>
      {details.survivalMonths < 6 && (
        <p className={`text-[10px] ${details.survivalMonths < 3 ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'} text-right -mt-1`}>
          {details.survivalMonths < 3 ? '危险！缓冲严重不足' : '缓冲偏少，需加强'}
        </p>
      )}

      <div className="flex justify-between py-1.5">
        <span className="text-[var(--color-text-muted)]">炒股贷款/存款</span>
        <span className={`font-semibold ${details.loanToDepositRisk ? 'text-[var(--color-danger)]' : 'text-[var(--color-safe)]'}`}>
          {details.loanToDepositRatio.toFixed(2)}
        </span>
      </div>
      {details.loanToDepositRisk && (
        <p className="text-[10px] text-[var(--color-danger)] text-right -mt-1">
          贷款超过存款，风险升级
        </p>
      )}
    </div>
  )
}
