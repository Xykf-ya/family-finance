import type { FamilyFinanceProfile, ProfitAllocation, LossWarning } from '../types/finance'
import { calculateThreeLines, totalMonthlyIncome, totalMonthlyExpenses, totalMonthlyLoanPayments, rigidMonthlyExpenses } from './risk'

export function allocateProfit(
  profile: FamilyFinanceProfile,
  todayProfit: number,
): ProfitAllocation {
  if (todayProfit <= 0) {
    return {
      toRepay: 0, toInvest: 0, toSave: 0,
      reasons: [],
      warning: null,
      conclusion: '',
    }
  }

  const lines = calculateThreeLines(profile)
  const stockLoan = profile.stockLoan
  const hasLoan = stockLoan.balance > 0

  // Zone-based ratios: [还贷, 继续炒股, 储蓄/零花]
  let ratios: [number, number, number]
  if (lines.zone === 'safe') {
    ratios = [0.3, 0.6, 0.1]
  } else if (lines.zone === 'warning') {
    ratios = [0.5, 0.4, 0.1]
  } else {
    ratios = [0.7, 0.25, 0.05]
  }

  // No stock loan → redirect repay portion to invest/save (60/40 split)
  if (!hasLoan) {
    const repayRatio = ratios[0]
    ratios[0] = 0
    ratios[1] += repayRatio * 0.6
    ratios[2] += repayRatio * 0.4
  }

  const toRepay = Math.round(todayProfit * ratios[0])
  const toInvest = Math.round(todayProfit * ratios[1])
  const toSave = todayProfit - toRepay - toInvest

  const reasons: string[] = []
  const wan = (v: number) => (v / 10000).toFixed(1)

  if (hasLoan) {
    reasons.push(`还贷 ${wan(toRepay)} 万（${(ratios[0] * 100).toFixed(0)}%），降低杠杆`)
  }
  reasons.push(`继续持仓 ${wan(toInvest)} 万（${(ratios[1] * 100).toFixed(0)}%），保留操作本金`)
  reasons.push(`储蓄/零花 ${wan(toSave)} 万（${(ratios[2] * 100).toFixed(0)}%），可用于家庭或备用`)

  // One-line conclusion
  const zoneLabel = lines.zone === 'safe' ? '' : lines.zone === 'warning' ? '，当前风险偏高' : '，当前处于危险区'
  const prefix = lines.zone === 'danger' ? '强烈建议提现' : lines.zone === 'warning' ? '建议提现' : '建议提现'
  const conclusion = `今日盈利 ${wan(todayProfit)} 万${zoneLabel} | ${prefix} ${wan(toRepay)} 万还贷，${wan(toInvest)} 万继续持仓，${wan(toSave)} 万可用于家庭`

  return { toRepay, toInvest, toSave, reasons, warning: null, conclusion }
}

// ─── Loss / deleverage ────────────────────────────────────

export function calculateLossWarning(profile: FamilyFinanceProfile): LossWarning {
  const lines = calculateThreeLines(profile)
  const I = totalMonthlyIncome(profile)
  const E = totalMonthlyExpenses(profile)
  const P = totalMonthlyLoanPayments(profile) - profile.stockLoan.monthlyPayment
  const Q = profile.stockLoan.monthlyPayment
  const D = profile.assets.savings
  const S = profile.assets.stockPosition
  const B = profile.stockLoan.balance
  const netMonthly = I - E - P - Q

  const buffer6 = 6 * netMonthly + D + 0.2 * S - B
  const buffer2 = 2 * netMonthly + D + 0.2 * S - B

  const M = rigidMonthlyExpenses(profile)
  const survivalMonths = M > 0 ? D / M : 999

  // How much to repay to reach safe zone (buffer6 >= 100001)
  const suggestedRepayment = Math.max(0, 100001 - buffer6)

  const wan = (v: number) => (v / 10000).toFixed(1)

  let conclusion: string
  if (lines.zone === 'danger') {
    conclusion = `当前处于危险区，缓冲资金 ${wan(buffer2)} 万已转负 | 建议减仓还款 ${wan(suggestedRepayment)} 万以回到安全区`
  } else if (lines.zone === 'warning') {
    conclusion = `当前处于警戒区，缓冲资金 ${wan(buffer6)} 万不足 10 万 | 建议减仓还款 ${wan(suggestedRepayment)} 万以回到安全区`
  } else {
    conclusion = `当前处于安全区，缓冲资金 ${wan(buffer6)} 万，存款可支撑 ${survivalMonths >= 999 ? '∞' : survivalMonths.toFixed(1)} 个月`
  }

  return { zone: lines.zone, buffer6, buffer2, survivalMonths, suggestedRepayment, conclusion }
}

// ─── Breakeven chart (kept for reference, not used in current UI) ───

export function calculateBreakeven(
  profile: FamilyFinanceProfile,
): { returnRate: number; netProfit: number; label: string }[] {
  const stockLoan = profile.stockLoan
  const S = profile.assets.stockPosition
  const loanBalance = stockLoan.balance
  const loanRate = stockLoan.annualRate / 100

  const annualInterest = loanBalance * loanRate

  const rates = [-30, -20, -10, -5, 0, 5, 10, 15, 20, 30, 40, 50]
  return rates.map((r) => {
    const grossProfit = S * (r / 100)
    const netProfit = grossProfit - annualInterest
    let label = ''
    if (r >= 0 && netProfit >= 0) label = '盈利'
    else if (r >= 0 && netProfit < 0) label = '赚了但不够还利息'
    else if (r < 0 && netProfit < annualInterest * -1) label = '严重亏损'
    else label = '小幅亏损'
    return { returnRate: r, netProfit, label }
  })
}
