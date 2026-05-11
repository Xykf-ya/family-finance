import type { FamilyFinanceProfile, ThreeLines, RiskDetails } from '../types/finance'

// ─── Basic helpers ──────────────────────────────────────

export function totalMonthlyIncome(profile: FamilyFinanceProfile): number {
  return profile.income.salary + profile.income.other
}

export function totalMonthlyExpenses(profile: FamilyFinanceProfile): number {
  return profile.expenses.daily + profile.expenses.education + profile.expenses.elderCare + profile.expenses.other
}

export function totalMonthlyLoanPayments(profile: FamilyFinanceProfile): number {
  return profile.loans.reduce((sum, l) => sum + l.monthlyPayment, 0) + profile.stockLoan.monthlyPayment
}

export function rigidMonthlyExpenses(profile: FamilyFinanceProfile): number {
  return totalMonthlyExpenses(profile) + totalMonthlyLoanPayments(profile)
}

export function monthlyFreeCashflow(profile: FamilyFinanceProfile): number {
  return totalMonthlyIncome(profile) - rigidMonthlyExpenses(profile)
}

export function emergencyReserveTarget(profile: FamilyFinanceProfile): number {
  return rigidMonthlyExpenses(profile) * profile.settings.emergencyMonths + profile.settings.emergencyExtra
}

export function emergencyReserveCurrent(profile: FamilyFinanceProfile): number {
  return profile.assets.savings
}

export function totalAssets(profile: FamilyFinanceProfile): number {
  return profile.assets.savings + profile.assets.houseValue + profile.assets.otherFixedAssets + profile.assets.stockPosition
}

export function totalLiabilities(profile: FamilyFinanceProfile): number {
  return profile.loans.reduce((sum, loan) => {
    const remainingMonths = loan.totalMonths - loan.paidMonths
    if (remainingMonths <= 0) return sum
    if (loan.repaymentMethod === 'equal-installment') {
      const r = loan.annualRate / 100 / 12
      if (r === 0) return sum + loan.monthlyPayment * remainingMonths
      return sum + loan.monthlyPayment * (1 - Math.pow(1 + r, -remainingMonths)) / r
    } else {
      return sum + loan.totalAmount * (remainingMonths / loan.totalMonths)
    }
  }, 0) + profile.stockLoan.balance
}

export function netWorth(profile: FamilyFinanceProfile): number {
  return totalAssets(profile) - totalLiabilities(profile)
}

export function assetLiabilityRatio(profile: FamilyFinanceProfile): number {
  const assets = totalAssets(profile)
  if (assets <= 0) return 0
  return (totalLiabilities(profile) / assets) * 100
}

// ─── Three lines ────────────────────────────────────────

/**
 * 缓冲资金(N) = D + 0.2×S − B + N×(I − E − P − Q)
 *
 * I = 月税后收入, D = 存款, S = 股票市值, B = 炒股贷款余额
 * E = 月生活支出合计, P = 房贷车贷月供合计, Q = 炒股贷款月还款
 *
 * 安全线 (N=6 缓冲 > 10万):  V₆ = 6I + D + 0.2S − B − 6(E+P+Q)
 * 警戒线 (N=6 缓冲 = 0):    V₆ = 0
 * 破产线 (N=2 缓冲 = 0):    V₂ = 2I + D + 0.2S − B − 2(E+P+Q)
 *
 * 三条线为 S 参考值（在当前条件下达到各边界的股票市值）：
 *   S_safe     = 5 × (100000 + B + 6(E+P+Q) − 6I − D)
 *   S_warning  = 5 × (B + 6(E+P+Q) − 6I − D)
 *   S_bankrupt = 5 × (B + 2(E+P+Q) − 2I − D)
 */
export function calculateThreeLines(profile: FamilyFinanceProfile): ThreeLines {
  const I = totalMonthlyIncome(profile)
  const E = totalMonthlyExpenses(profile)
  const P = totalMonthlyLoanPayments(profile) - profile.stockLoan.monthlyPayment
  const Q = profile.stockLoan.monthlyPayment
  const D = profile.assets.savings
  const S = profile.assets.stockPosition
  const B = profile.stockLoan.balance

  const netMonthly = I - E - P - Q

  const safetyLine = Math.max(0, 5 * (100000 + B - 6 * netMonthly - D))
  const warningLine = Math.max(0, 5 * (B - 6 * netMonthly - D))
  const bankruptcyLine = Math.max(0, 5 * (B - 2 * netMonthly - D))

  const V6 = 6 * netMonthly + D + 0.2 * S - B
  const V2 = 2 * netMonthly + D + 0.2 * S - B

  let zone: ThreeLines['zone']
  if (V6 >= 100000) {
    zone = 'safe'
  } else if (V2 >= 0) {
    zone = 'warning'
  } else {
    zone = 'danger'
  }

  return { safetyLine, warningLine, bankruptcyLine, currentPosition: S, zone }
}

// ─── Risk details ───────────────────────────────────────

/**
 * 风险评估细节：
 * - 月贷款还款/月收入比
 * - 股票归零后存款可支撑月数
 * - 贷款/存款比
 * - 综合风险评分 0-100
 */
export function calculateRiskDetails(profile: FamilyFinanceProfile): RiskDetails {
  const income = totalMonthlyIncome(profile)
  const loanPayment = totalMonthlyLoanPayments(profile)
  const D = profile.assets.savings
  const M = rigidMonthlyExpenses(profile)
  const stockLoanBalance = profile.stockLoan.balance

  // 1. 月还款/月收入比
  const loanToIncomeRatio = income > 0 ? (loanPayment / income) * 100 : 0
  const loanToIncomeStatus: RiskDetails['loanToIncomeStatus'] =
    loanToIncomeRatio <= 30 ? 'safe' : loanToIncomeRatio <= 40 ? 'warning' : 'danger'

  // 2. 股票归零后存款可支撑月数
  const survivalMonths = M > 0 ? D / M : 999
  const survivalStatus: RiskDetails['survivalStatus'] =
    survivalMonths >= 6 ? 'safe' : survivalMonths >= 3 ? 'warning' : 'danger'

  // 3. 贷款/存款比
  const loanToDepositRatio = D > 0 ? stockLoanBalance / D : (stockLoanBalance > 0 ? 999 : 0)
  const loanToDepositRisk = loanToDepositRatio > 1

  // 4. 综合风险评分 0-100
  let score = 0
  // 月供压力分 (0-25)
  if (loanToIncomeRatio <= 30) score += 25
  else if (loanToIncomeRatio <= 40) score += 12
  // 生存月数分 (0-25)
  if (survivalMonths >= 6) score += 25
  else if (survivalMonths >= 3) score += 12
  // 贷款存款比分 (0-25)
  if (loanToDepositRatio <= 1) score += 25
  else if (loanToDepositRatio <= 2) score += 12
  // 当前仓位分 (0-25)
  const lines = calculateThreeLines(profile)
  if (lines.zone === 'safe') score += 25
  else if (lines.zone === 'warning') score += 12

  return { loanToIncomeRatio, loanToIncomeStatus, survivalMonths, survivalStatus,
    loanToDepositRatio, loanToDepositRisk, riskScore: score }
}
