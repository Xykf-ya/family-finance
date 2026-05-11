import Card from '../components/ui/Card'
import NumberInput from '../components/ui/NumberInput'
import AssetOverview from '../components/dashboard/AssetOverview'
import AssetPieChart from '../components/dashboard/AssetPieChart'
import CashflowCard from '../components/dashboard/CashflowCard'
import LiabilityRatio from '../components/dashboard/LiabilityRatio'
import { useFinanceStore } from '../hooks/useFinanceStore'
import { useState, useRef } from 'react'
import type { Loan } from '../types/finance'
import { exportAsImage } from '../utils/export'
import { fmtWanFull } from '../utils/format'

export default function DashboardPage() {
  const { profile, updateIncome, updateExpenses, updateAssets, updateSettings, addLoan, removeLoan } = useFinanceStore()

  const [showLoanForm, setShowLoanForm] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Partial<Loan>>({})
  const summaryRef = useRef<HTMLDivElement>(null)

  const hasData = profile.income.salary > 0 || profile.assets.savings > 0 || profile.loans.length > 0

  const handleAddLoan = () => {
    if (!editingLoan.name?.trim() || !editingLoan.totalAmount) return
    const loan: Loan = {
      id: Date.now().toString(),
      name: editingLoan.name || '',
      type: editingLoan.type || 'mortgage',
      repaymentMethod: editingLoan.repaymentMethod || 'equal-installment',
      totalAmount: editingLoan.totalAmount || 0,
      annualRate: editingLoan.annualRate || 4.2,
      totalMonths: editingLoan.totalMonths || 360,
      paidMonths: editingLoan.paidMonths || 0,
      monthlyPayment: editingLoan.monthlyPayment || 0,
    }
    addLoan(loan)
    setEditingLoan({})
    setShowLoanForm(false)
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <header className="pt-2 pb-1">
        <h1 className="font-serif text-2xl font-bold text-[var(--color-text)]">
          我们家
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          每项数据都只保存在你的手机里，不会上传到任何地方
        </p>
      </header>

      {/* Quick input: income & expenses */}
      <Card title="收支设置">
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="月薪收入（合计）"
            value={profile.income.salary}
            onChange={(v) => updateIncome('salary', v)}
            hint="税后月薪，家庭合计"
          />
          <NumberInput
            label="其他收入"
            value={profile.income.other}
            onChange={(v) => updateIncome('other', v)}
            hint="租金、兼职等"
          />
          <NumberInput
            label="日常开销"
            value={profile.expenses.daily}
            onChange={(v) => updateExpenses('daily', v)}
          />
          <NumberInput
            label="子女教育"
            value={profile.expenses.education}
            onChange={(v) => updateExpenses('education', v)}
          />
          <NumberInput
            label="老人赡养"
            value={profile.expenses.elderCare}
            onChange={(v) => updateExpenses('elderCare', v)}
          />
          <NumberInput
            label="其他支出"
            value={profile.expenses.other}
            onChange={(v) => updateExpenses('other', v)}
          />
        </div>
      </Card>

      {/* Asset settings */}
      <Card title="资产情况">
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="存款/理财"
            value={profile.assets.savings}
            onChange={(v) => updateAssets('savings', v)}
          />
          <NumberInput
            label="房产估值"
            value={profile.assets.houseValue}
            onChange={(v) => updateAssets('houseValue', v)}
          />
          <NumberInput
            label="其他固定资产"
            value={profile.assets.otherFixedAssets}
            onChange={(v) => updateAssets('otherFixedAssets', v)}
          />
          <NumberInput
            label="股票仓位"
            value={profile.assets.stockPosition}
            onChange={(v) => updateAssets('stockPosition', v)}
          />
        </div>
      </Card>

      {/* Loan management */}
      <Card title="贷款管理">
        {profile.loans.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {profile.loans.map((loan) => (
              <div
                key={loan.id}
                className="flex items-center justify-between py-2 px-3 bg-[var(--color-bg)] rounded-lg text-sm"
              >
                <div>
                  <span className="font-medium">{loan.name}</span>
                  <span className="text-[var(--color-text-muted)] ml-2">
                    {fmtWanFull(loan.monthlyPayment)}/月
                  </span>
                </div>
                <button
                  onClick={() => removeLoan(loan.id)}
                  className="text-xs text-[var(--color-danger)]"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}

        {showLoanForm ? (
          <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--color-bg)] rounded-lg">
            <div className="col-span-2">
              <label className="text-xs text-[var(--color-text-muted)] font-medium">贷款名称</label>
              <input
                className="w-full bg-transparent border-b border-[var(--color-border)] py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="如：建设银行房贷"
                value={editingLoan.name ?? ''}
                onChange={(e) => setEditingLoan({ ...editingLoan, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1">还款方式</label>
              <select
                className="w-full bg-transparent border-b border-[var(--color-border)] py-2 text-sm focus:outline-none"
                value={editingLoan.repaymentMethod || 'equal-installment'}
                onChange={(e) => setEditingLoan({ ...editingLoan, repaymentMethod: e.target.value as 'equal-installment' | 'equal-principal' })}
              >
                <option value="equal-installment">等额本息</option>
                <option value="equal-principal">等额本金</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1">贷款类型</label>
              <select
                className="w-full bg-transparent border-b border-[var(--color-border)] py-2 text-sm focus:outline-none"
                value={editingLoan.type || 'mortgage'}
                onChange={(e) => setEditingLoan({ ...editingLoan, type: e.target.value as Loan['type'] })}
              >
                <option value="mortgage">房贷</option>
                <option value="car">车贷</option>
                <option value="credit">信用贷</option>
                <option value="other">其他</option>
              </select>
            </div>
            <NumberInput
              label="贷款总额"
              value={editingLoan.totalAmount || 0}
              onChange={(v) => setEditingLoan({ ...editingLoan, totalAmount: v })}
            />
            <NumberInput
              label="年利率(%)"
              value={editingLoan.annualRate || 0}
              onChange={(v) => setEditingLoan({ ...editingLoan, annualRate: v })}
              unit="%"
              scale={1}
            />
            <NumberInput
              label="总期数(月)"
              value={editingLoan.totalMonths || 0}
              onChange={(v) => setEditingLoan({ ...editingLoan, totalMonths: v })}
              unit="月"
              scale={1}
            />
            <NumberInput
              label="已还期数(月)"
              value={editingLoan.paidMonths || 0}
              onChange={(v) => setEditingLoan({ ...editingLoan, paidMonths: v })}
              unit="月"
              scale={1}
            />
            <NumberInput
              label="当前月供"
              value={editingLoan.monthlyPayment || 0}
              onChange={(v) => setEditingLoan({ ...editingLoan, monthlyPayment: v })}
            />
            <div className="col-span-2 flex gap-2 mt-2">
              <button
                onClick={handleAddLoan}
                className="flex-1 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium"
              >
                添加贷款
              </button>
              <button
                onClick={() => { setShowLoanForm(false); setEditingLoan({}) }}
                className="py-2 px-4 border border-[var(--color-border)] rounded-lg text-sm"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLoanForm(true)}
            className="w-full py-2 border border-dashed border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-muted)]"
          >
            + 添加贷款
          </button>
        )}
      </Card>

      {/* Emergency reserve setting */}
      <Card title="应急储备金设置">
        <div className="flex flex-col gap-4">
          <div className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            应急储备金目标 = 月刚性支出 × 月数 + 风险应对金
          </div>
          <NumberInput
            label="应急储备金月数"
            value={profile.settings.emergencyMonths}
            onChange={(v) => updateSettings('emergencyMonths', v)}
            unit="个月"
            scale={1}
            hint="建议保留3-6个月的刚性支出作为应急储备"
            min={1}
          />
          <NumberInput
            label="风险应对金"
            value={profile.settings.emergencyExtra ?? 0}
            onChange={(v) => updateSettings('emergencyExtra', v)}
            hint="大病预防、意外灾害等一次性风险应对金额"
          />
        </div>
      </Card>

      {/* Overview section */}
      {hasData && (
        <>
          <div className="mt-2 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[var(--color-text)]">
              家庭财务快照
            </h2>
            <button
              onClick={() => summaryRef.current && exportAsImage(summaryRef.current)}
              className="text-xs px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] transition-colors"
            >
              导出图片发给子女
            </button>
          </div>
          <div ref={summaryRef}>
            <AssetOverview />
            <Card title="资产构成">
              <AssetPieChart />
            </Card>
            <CashflowCard />
            <LiabilityRatio />
          </div>
        </>
      )}
    </div>
  )
}
