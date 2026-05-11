import { create } from 'zustand'
import type { FamilyFinanceProfile } from '../types/finance'
import { DEFAULT_PROFILE } from '../types/finance'

const STORAGE_KEY = 'family-finance-profile'

function loadFromStorage(): FamilyFinanceProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch { /* corrupted data, use default */ }
  return { ...DEFAULT_PROFILE }
}

function saveToStorage(data: FamilyFinanceProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }))
  } catch { /* storage full, silently ignore */ }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSave(data: FamilyFinanceProfile) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveToStorage(data), 500)
}

interface FinanceStore {
  profile: FamilyFinanceProfile

  updateIncome: (key: 'salary' | 'other', value: number) => void
  updateExpenses: (key: 'daily' | 'education' | 'elderCare' | 'other', value: number) => void
  updateAssets: (key: 'savings' | 'houseValue' | 'otherFixedAssets' | 'stockPosition', value: number) => void
  updateSettings: (key: 'emergencyMonths' | 'emergencyExtra' | 'warningMonths', value: number) => void
  updateStockLoan: (key: 'balance' | 'annualRate' | 'monthlyPayment', value: number) => void
  addLoan: (loan: FamilyFinanceProfile['loans'][0]) => void
  updateLoan: (id: string, loan: Partial<FamilyFinanceProfile['loans'][0]>) => void
  removeLoan: (id: string) => void
  resetAll: () => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  profile: loadFromStorage(),

  updateIncome: (key, value) =>
    set((s) => {
      const profile = { ...s.profile, income: { ...s.profile.income, [key]: value } }
      debouncedSave(profile)
      return { profile }
    }),

  updateExpenses: (key, value) =>
    set((s) => {
      const profile = { ...s.profile, expenses: { ...s.profile.expenses, [key]: value } }
      debouncedSave(profile)
      return { profile }
    }),

  updateAssets: (key, value) =>
    set((s) => {
      const profile = { ...s.profile, assets: { ...s.profile.assets, [key]: value } }
      debouncedSave(profile)
      return { profile }
    }),

  updateSettings: (key, value) =>
    set((s) => {
      const profile = { ...s.profile, settings: { ...s.profile.settings, [key]: value } }
      debouncedSave(profile)
      return { profile }
    }),

  updateStockLoan: (key, value) =>
    set((s) => {
      const profile = { ...s.profile, stockLoan: { ...s.profile.stockLoan, [key]: value } }
      debouncedSave(profile)
      return { profile }
    }),

  addLoan: (loan) =>
    set((s) => {
      const profile = { ...s.profile, loans: [...s.profile.loans, loan] }
      debouncedSave(profile)
      return { profile }
    }),

  updateLoan: (id, partial) =>
    set((s) => {
      const profile = {
        ...s.profile,
        loans: s.profile.loans.map((l) => (l.id === id ? { ...l, ...partial } : l)),
      }
      debouncedSave(profile)
      return { profile }
    }),

  removeLoan: (id) =>
    set((s) => {
      const profile = { ...s.profile, loans: s.profile.loans.filter((l) => l.id !== id) }
      debouncedSave(profile)
      return { profile }
    }),

  resetAll: () => {
    const profile = { ...DEFAULT_PROFILE }
    saveToStorage(profile)
    set({ profile })
  },
}))
