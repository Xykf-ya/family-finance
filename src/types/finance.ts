export interface Loan {
  id: string
  name: string
  type: 'mortgage' | 'car' | 'credit' | 'other'
  repaymentMethod: 'equal-installment' | 'equal-principal'
  totalAmount: number
  annualRate: number
  totalMonths: number
  paidMonths: number
  monthlyPayment: number
}

export interface StockLoan {
  balance: number // 炒股贷款余额
  annualRate: number // 年利率
  monthlyPayment: number // 月还款额
}

export interface FamilyFinanceProfile {
  updatedAt: string

  income: {
    salary: number
    other: number
  }

  expenses: {
    daily: number
    education: number
    elderCare: number
    other: number
  }

  loans: Loan[]

  assets: {
    savings: number
    houseValue: number
    otherFixedAssets: number
    stockPosition: number
  }

  stockLoan: StockLoan

  settings: {
    emergencyMonths: number // 应急储备金月数
    emergencyExtra: number // 风险应对金
    warningMonths: number // 警戒月数
  }
}

export const DEFAULT_PROFILE: FamilyFinanceProfile = {
  updatedAt: '',
  income: { salary: 0, other: 0 },
  expenses: { daily: 0, education: 0, elderCare: 0, other: 0 },
  loans: [],
  assets: { savings: 0, houseValue: 0, otherFixedAssets: 0, stockPosition: 0 },
  stockLoan: { balance: 0, annualRate: 5, monthlyPayment: 0 },
  settings: { emergencyMonths: 3, emergencyExtra: 0, warningMonths: 3 },
}

// ─── Investment / Risk ──────────────────────────────────

export interface ThreeLines {
  safetyLine: number
  warningLine: number
  bankruptcyLine: number
  currentPosition: number
  zone: 'safe' | 'warning' | 'danger'
}

export interface RiskDetails {
  loanToIncomeRatio: number // 月还款/月收入比 (%)
  loanToIncomeStatus: 'safe' | 'warning' | 'danger'
  survivalMonths: number // 股票归零后存款可支撑月数
  survivalStatus: 'safe' | 'warning' | 'danger'
  loanToDepositRatio: number // 贷款/存款比
  loanToDepositRisk: boolean
  riskScore: number // 0-100
}

export interface ProfitAllocation {
  toRepay: number
  toInvest: number
  toSave: number
  reasons: string[]
  warning: string | null
  conclusion: string
}

export interface LossWarning {
  zone: ThreeLines['zone']
  buffer6: number
  buffer2: number
  survivalMonths: number
  suggestedRepayment: number
  conclusion: string
}

export interface BreakevenPoint {
  returnRate: number // 股票年化收益率
  netProfit: number // 扣除利息后的净盈亏
  label: string
}
