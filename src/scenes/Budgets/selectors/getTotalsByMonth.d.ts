interface TagTotals {
  budgeted: number
  income: number
  outcome: number
  overspent: number
  available: number
}

interface MonthTotals {
  date: number
  prevFunds: number
  prevOverspent: number
  toBeBudgeted: number
  budgetedInFuture: number // cannot be negative or greater than funds
  moneyInBudget: number // to check
  realBudgetedInFuture: number
  funds: number
  // TAGS
  budgeted: number
  income: number
  outcome: number
  overspent: number
  available: number
  // TRANSFERS
  transferOutcome: number
  transferFees: number
}

export function getTagTotals(state: any): TagTotals[]
export function getTotalsArray(state: any): MonthTotals[]
export function getTotalsByMonth(state: any): { [key: number]: MonthTotals }
