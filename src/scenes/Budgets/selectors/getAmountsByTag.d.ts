interface ChildAmounts {
  income: number
  outcome: number
  tagOutcome: number
  transferOutcome: number
  budgeted: number
  leftover: number
  available: number
}

interface TagAmounts {
  // Group totals
  totalBudgeted: number
  totalOutcome: number
  totalIncome: number
  totalLeftover: number
  totalAvailable: number
  totalOverspent: number

  // Main tag amounts
  budgeted: number
  income: number
  tagOutcome: number
  transferOutcome: number
  outcome: number
  leftover: number
  available: number

  // Children totals
  childrenBudgeted: number
  childrenOutcome: number
  childrenIncome: number
  childrenAvailable: number
  childrenOverspent: number
  childrenLeftover: number

  children: {
    [childId: string]: ChildAmounts
  }
}

export function getTransfers(
  state: any
): {
  [month: number]: {
    [accId: string]: number
  }
}

export function getLinkedTransfers(
  state: any
): {
  [month: number]: {
    [tagId: string]: number
  }
}

export function getTransferFees(state: any): { [month: number]: number }

export function getAmountsForTag(
  state: any
): (month: number, tagId: string) => TagAmounts | ChildAmounts | null

export function getAmountsByTag(
  state: any
): {
  [month: number]: {
    [tagId: string]: TagAmounts
  }
}
