import { RootState } from 'store'

interface TagAmounts {
  income: number
  outcome: number
  tagOutcome: number
  transferOutcome: number
  budgeted: number
  leftover: number
  available: number
}

interface TagGroupAmounts extends TagAmounts {
  // Group totals
  totalBudgeted: number
  totalOutcome: number
  totalIncome: number
  totalLeftover: number
  totalAvailable: number
  totalOverspent: number

  // Children totals
  childrenBudgeted: number
  childrenOutcome: number
  childrenIncome: number
  childrenAvailable: number
  childrenOverspent: number
  childrenLeftover: number

  children: {
    [childId: string]: TagAmounts
  }
}

export function getTransfers(
  state: RootState
): {
  [month: number]: {
    [accId: string]: number
  }
}

export function getLinkedTransfers(
  state: RootState
): {
  [month: number]: {
    [tagId: string]: number
  }
}

export function getTransferFees(state: RootState): { [month: number]: number }

export function getAmountsForTag(
  state: RootState
): (month: number, tagId: string) => TagAmounts | TagGroupAmounts | null

export function getAmountsByTag(
  state: RootState
): {
  [month: number]: {
    [tagId: string]: TagAmounts
  }
}
