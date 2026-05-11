import { useState, useMemo } from 'react'
import Card from '../components/ui/Card'
import NumberInput from '../components/ui/NumberInput'
import { useFinanceStore } from '../hooks/useFinanceStore'
import { calculatePrepayResult, getChartSeries, remainingPrincipal } from '../utils/loan'
import { fmtWanFull } from '../utils/format'
import type { PrepayResult, MonthlyEntry, ChartPoint } from '../utils/loan'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

type PrepayMode = 'reduce-term' | 'reduce-monthly'

export default function LoanPage() {
  const { profile } = useFinanceStore()
  const [selectedLoanId, setSelectedLoanId] = useState('')
  const [prepayAmount, setPrepayAmount] = useState(0)
  const [mode, setMode] = useState<PrepayMode>('reduce-term')
  const [showDetail, setShowDetail] = useState(false)

  const loan = profile.loans.find((l) => l.id === selectedLoanId)
  const rp = loan ? remainingPrincipal(loan) : 0

  const result: PrepayResult | null = useMemo(() => {
    if (!loan || prepayAmount <= 0) return null
    return calculatePrepayResult(loan, prepayAmount)
  }, [loan, prepayAmount])

  const active = mode === 'reduce-term' ? result?.termResult : result?.monthlyResult

  // Chart data: compare before vs after schedule for selected mode
  const chartData: ChartPoint[] = useMemo(() => {
    if (!result || !active) return []
    return getChartSeries(result.beforeSchedule, active.schedule, Math.min(120, active.schedule.length))
  }, [result, active])

  // Format chart data for Recharts
  const chartPoints = chartData.map((p) => ({
    month: p.month,
    前: Math.round(p.before),
    后: Math.round(p.after),
  }))

  return (
    <div className="p-4 flex flex-col gap-4">
      <header className="pt-2 pb-1">
        <h1 className="font-serif text-2xl font-bold text-[var(--color-text)]">
          还贷决策
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          算一算提前还贷能省多少利息
        </p>
      </header>

      {/* Loan selector */}
      <Card title="选择贷款">
        {profile.loans.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            请先在首页「贷款管理」中添加贷款
          </p>
        ) : (
          <select
            className="w-full bg-transparent border-b border-[var(--color-border)] py-2 text-sm focus:outline-none"
            value={selectedLoanId}
            onChange={(e) => setSelectedLoanId(e.target.value)}
          >
            <option value="">请选择一笔贷款</option>
            {profile.loans.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} — 月供{fmtWanFull(l.monthlyPayment)}
              </option>
            ))}
          </select>
        )}
      </Card>

      {loan && (
        <>
          {/* Loan summary */}
          <Card title="贷款概况">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">还款方式</span>
                <span className="font-medium">
                  {loan.repaymentMethod === 'equal-installment' ? '等额本息' : '等额本金'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">年利率</span>
                <span className="font-medium">{loan.annualRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">当前剩余本金</span>
                <span className="font-semibold">{fmtWanFull(rp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">当前月供</span>
                <span className="font-semibold">{fmtWanFull(loan.monthlyPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">剩余期数</span>
                <span className="font-medium">{loan.totalMonths - loan.paidMonths} 个月</span>
              </div>
              {result && (
                <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
                  <span className="text-[var(--color-text-muted)]">不提前还款，未来总利息</span>
                  <span className="font-semibold text-[var(--color-danger)]">
                    {fmtWanFull(result.totalInterestBefore)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Prepay input & mode selection */}
          <Card title="提前还款设置">
            <div className="flex flex-col gap-3">
              <NumberInput
                label="拟提前还款金额"
                value={prepayAmount}
                onChange={setPrepayAmount}
                hint={`最多可还 ${fmtWanFull(rp)}（剩余本金全额）`}
              />

              <div>
                <label className="text-xs text-[var(--color-text-muted)] font-medium block mb-2">
                  还款方式
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('reduce-term')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      mode === 'reduce-term'
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                    }`}
                  >
                    缩短年限（月供不变）
                  </button>
                  <button
                    onClick={() => setMode('reduce-monthly')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      mode === 'reduce-monthly'
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                    }`}
                  >
                    减少月供（年限不变）
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Results */}
          {active && (
            <>
              <Card title="计算结果">
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">节省利息</span>
                    <span className="font-serif font-bold text-lg text-[var(--color-safe)]">
                      {fmtWanFull(active.savedInterest)}
                    </span>
                  </div>

                  {mode === 'reduce-term' && result?.termResult && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">新还款期限</span>
                        <span className="font-semibold">
                          {result.termResult.newTermMonths} 个月（缩短 {result.termResult.monthsReduced} 个月）
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">月供</span>
                        <span className="font-semibold">{fmtWanFull(loan.monthlyPayment)}（不变）</span>
                      </div>
                    </>
                  )}

                  {mode === 'reduce-monthly' && result?.monthlyResult && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">新月供</span>
                        <span className="font-semibold">{fmtWanFull(result.monthlyResult.newMonthly)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">每月节省</span>
                        <span className="font-semibold text-[var(--color-safe)]">
                          {fmtWanFull(result.monthlyResult.monthlySaved)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">剩余期限</span>
                        <span className="font-semibold">{loan.totalMonths - loan.paidMonths} 个月（不变）</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Interest comparison chart */}
              {chartPoints.length > 0 && (
                <Card title="累计利息走势对比">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartPoints} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                          label={{ value: '月份', position: 'insideBottom', offset: -5, fontSize: 11 }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                          tickFormatter={(v: number) => fmtWanFull(v)}
                          width={60}
                        />
                        <Tooltip
                          formatter={(v) => [fmtWanFull(Number(v)), '']}
                          labelFormatter={(l) => `第 ${String(l)} 个月`}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                          type="monotone"
                          dataKey="前"
                          stroke="var(--color-danger)"
                          strokeWidth={2}
                          dot={false}
                          name="提前还款前"
                        />
                        <Line
                          type="monotone"
                          dataKey="后"
                          stroke="var(--color-safe)"
                          strokeWidth={2}
                          dot={false}
                          name="提前还款后"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Expandable monthly detail */}
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="w-full py-3 text-sm text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-lg"
              >
                {showDetail ? '收起逐月还款明细' : '查看逐月还款明细'}
              </button>

              {showDetail && active && (
                <Card title="逐月还款明细">
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[var(--color-surface)]">
                        <tr className="text-[var(--color-text-muted)]">
                          <th className="py-1.5 text-left">月</th>
                          <th className="py-1.5 text-right">月供</th>
                          <th className="py-1.5 text-right">本金</th>
                          <th className="py-1.5 text-right">利息</th>
                          <th className="py-1.5 text-right">剩余</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {active.schedule.slice(0, 120).map((row: MonthlyEntry) => (
                          <tr key={row.month}>
                            <td className="py-1.5">{row.month}</td>
                            <td className="py-1.5 text-right">{Math.round(row.payment).toLocaleString()}</td>
                            <td className="py-1.5 text-right">{Math.round(row.principal).toLocaleString()}</td>
                            <td className="py-1.5 text-right">{Math.round(row.interest).toLocaleString()}</td>
                            <td className="py-1.5 text-right">{Math.round(row.remaining).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {active.schedule.length > 120 && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center">
                      仅显示前 120 期，共 {active.schedule.length} 期
                    </p>
                  )}
                </Card>
              )}
            </>
          )}

          {!active && prepayAmount > 0 && (
            <div className="text-center py-4 text-sm text-[var(--color-warning)]">
              提前还款金额不能超过剩余本金
            </div>
          )}
        </>
      )}

      {!selectedLoanId && profile.loans.length > 0 && (
        <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
          ↑ 选择一笔贷款开始计算
        </div>
      )}
    </div>
  )
}
