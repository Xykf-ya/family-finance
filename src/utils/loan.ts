import type { Loan } from '../types/finance'

// ─── Types ───────────────────────────────────────────────

export interface MonthlyEntry {
  month: number
  payment: number
  principal: number
  interest: number
  remaining: number
}

export interface PrepayResult {
  currentPrincipal: number
  currentMonthly: number
  totalInterestBefore: number
  // reduce-term results
  termResult: {
    savedInterest: number
    newTermMonths: number
    monthsReduced: number
    schedule: MonthlyEntry[]
  } | null
  // reduce-monthly results
  monthlyResult: {
    savedInterest: number
    newMonthly: number
    monthlySaved: number
    schedule: MonthlyEntry[]
  } | null
  // original schedule
  beforeSchedule: MonthlyEntry[]
}

// ─── Equal-installment (等额本息) ────────────────────────

export function monthlyPaymentEqualInstallment(
  principal: number,
  annualRate: number,
  totalMonths: number,
): number {
  if (totalMonths <= 0 || principal <= 0) return 0
  const r = annualRate / 100 / 12
  if (r === 0) return principal / totalMonths
  return (principal * r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1)
}

/** Generate schedule for equal-installment */
function generateEqualInstallmentSchedule(
  principal: number,
  annualRate: number,
  remainingMonths: number,
  monthlyPayment: number,
): MonthlyEntry[] {
  const r = annualRate / 100 / 12
  const schedule: MonthlyEntry[] = []
  let balance = principal

  for (let i = 1; i <= remainingMonths; i++) {
    const interest = balance * r
    const principalPaid = monthlyPayment - interest
    balance -= principalPaid
    if (balance < 0) balance = 0
    schedule.push({
      month: i,
      payment: monthlyPayment,
      principal: principalPaid,
      interest,
      remaining: balance,
    })
  }
  return schedule
}

/** Remaining term after prepay (reduce-term mode) */
function remainingMonthsAfterPrepay(
  principalAfterPrepay: number,
  annualRate: number,
  currentMonthly: number,
): number {
  if (principalAfterPrepay <= 0) return 0
  const r = annualRate / 100 / 12
  if (r === 0) return principalAfterPrepay / currentMonthly
  const inside = 1 - (principalAfterPrepay * r) / currentMonthly
  if (inside <= 0) return Infinity // monthly payment too low to cover interest
  return -Math.log(inside) / Math.log(1 + r)
}

// ─── Equal-principal (等额本金) ──────────────────────────

export function firstMonthlyPaymentEqualPrincipal(
  principal: number,
  annualRate: number,
  totalMonths: number,
): number {
  if (totalMonths <= 0 || principal <= 0) return 0
  const r = annualRate / 100 / 12
  return principal / totalMonths + principal * r
}

/** Generate schedule for equal-principal */
function generateEqualPrincipalSchedule(
  principal: number,
  annualRate: number,
  remainingMonths: number,
  _totalMonths: number,
  paidMonths: number,
): MonthlyEntry[] {
  const r = annualRate / 100 / 12
  const monthlyPrincipal = principal / remainingMonths
  const schedule: MonthlyEntry[] = []
  let balance = principal

  for (let i = 1; i <= remainingMonths; i++) {
    const interest = balance * r
    const payment = monthlyPrincipal + interest
    balance -= monthlyPrincipal
    if (balance < 0) balance = 0
    schedule.push({
      month: paidMonths + i,
      payment,
      principal: monthlyPrincipal,
      interest,
      remaining: balance,
    })
  }
  return schedule
}

// ─── Remaining principal ─────────────────────────────────

export function remainingPrincipal(loan: Loan): number {
  const remainingMonths = loan.totalMonths - loan.paidMonths
  if (remainingMonths <= 0) return 0

  if (loan.repaymentMethod === 'equal-installment') {
    const r = loan.annualRate / 100 / 12
    const pmt = loan.monthlyPayment
    if (r === 0) return pmt * remainingMonths
    return pmt * (1 - Math.pow(1 + r, -remainingMonths)) / r
  } else {
    return loan.totalAmount * (remainingMonths / loan.totalMonths)
  }
}

/** Total remaining interest without prepayment */
export function totalRemainingInterest(loan: Loan): number {
  const rp = remainingPrincipal(loan)
  const remainingMonths = loan.totalMonths - loan.paidMonths
  if (remainingMonths <= 0) return 0

  if (loan.repaymentMethod === 'equal-installment') {
    return loan.monthlyPayment * remainingMonths - rp
  } else {
    const r = loan.annualRate / 100 / 12
    const n = remainingMonths
    const monthlyPrincipal = loan.totalAmount / loan.totalMonths
    return r * (rp * n - monthlyPrincipal * n * (n - 1) / 2)
  }
}

// ─── Main calculation ────────────────────────────────────

export function calculatePrepayResult(loan: Loan, prepayAmount: number): PrepayResult {
  const rp = remainingPrincipal(loan)
  const remainingMonths = loan.totalMonths - loan.paidMonths
  const actualRepay = Math.min(prepayAmount, rp)
  const newPrincipal = rp - actualRepay

  // Current state
  const currentMonthly = loan.monthlyPayment
  const totalInterestBefore = totalRemainingInterest(loan)

  // Generate original schedule
  let beforeSchedule: MonthlyEntry[]
  if (loan.repaymentMethod === 'equal-installment') {
    beforeSchedule = generateEqualInstallmentSchedule(rp, loan.annualRate, remainingMonths, currentMonthly)
  } else {
    beforeSchedule = generateEqualPrincipalSchedule(rp, loan.annualRate, remainingMonths, loan.totalMonths, loan.paidMonths)
  }

  // ── reduce-term (月供不变，缩短年限) ──
  let termResult: PrepayResult['termResult'] = null
  const newTermMonths = Math.ceil(remainingMonthsAfterPrepay(newPrincipal, loan.annualRate, currentMonthly))
  if (newTermMonths > 0 && newTermMonths < Infinity) {
    const termSchedule = generateEqualInstallmentSchedule(newPrincipal, loan.annualRate, newTermMonths, currentMonthly)
    const totalInterestAfter = termSchedule.reduce((s, e) => s + e.interest, 0)
    termResult = {
      savedInterest: totalInterestBefore - totalInterestAfter,
      newTermMonths,
      monthsReduced: remainingMonths - newTermMonths,
      schedule: termSchedule,
    }
  }

  // ── reduce-monthly (年限不变，减少月供) ──
  let monthlyResult: PrepayResult['monthlyResult'] = null
  if (loan.repaymentMethod === 'equal-installment') {
    const newMonthly = monthlyPaymentEqualInstallment(newPrincipal, loan.annualRate, remainingMonths)
    if (newMonthly > 0) {
      const monthlySchedule = generateEqualInstallmentSchedule(newPrincipal, loan.annualRate, remainingMonths, newMonthly)
      const totalInterestAfter = monthlySchedule.reduce((s, e) => s + e.interest, 0)
      monthlyResult = {
        savedInterest: totalInterestBefore - totalInterestAfter,
        newMonthly,
        monthlySaved: currentMonthly - newMonthly,
        schedule: monthlySchedule,
      }
    }
  } else {
    // Equal-principal: after prepay, principal is reduced, so monthly payment drops proportionally
    const monthlyPrincipal = loan.totalAmount / loan.totalMonths
    const newMonthlyPrincipal = newPrincipal / remainingMonths
    const r = loan.annualRate / 100 / 12
    const newFirstMonthly = newMonthlyPrincipal + newPrincipal * r
    const oldFirstMonthly = monthlyPrincipal + rp * r
    if (remainingMonths > 0) {
      const monthlySchedule = generateEqualPrincipalSchedule(newPrincipal, loan.annualRate, remainingMonths, loan.totalMonths, loan.paidMonths)
      const totalInterestAfter = monthlySchedule.reduce((s, e) => s + e.interest, 0)
      monthlyResult = {
        savedInterest: totalInterestBefore - totalInterestAfter,
        newMonthly: newFirstMonthly,
        monthlySaved: oldFirstMonthly - newFirstMonthly,
        schedule: monthlySchedule,
      }
    }
  }

  return {
    currentPrincipal: rp,
    currentMonthly,
    totalInterestBefore,
    termResult,
    monthlyResult,
    beforeSchedule,
  }
}

// ─── Interest-only series for chart ──────────────────────

export interface ChartPoint {
  month: number
  before: number
  after: number
}

export function getChartSeries(
  beforeSchedule: MonthlyEntry[],
  afterSchedule: MonthlyEntry[],
  maxMonths?: number,
): ChartPoint[] {
  const len = Math.min(
    maxMonths || Infinity,
    Math.max(beforeSchedule.length, afterSchedule.length),
  )
  const points: ChartPoint[] = []
  let beforeCum = 0
  let afterCum = 0

  for (let i = 0; i < len; i++) {
    beforeCum += beforeSchedule[i]?.interest || 0
    afterCum += afterSchedule[i]?.interest || 0
    points.push({ month: i + 1, before: beforeCum, after: afterCum })
  }
  return points
}
