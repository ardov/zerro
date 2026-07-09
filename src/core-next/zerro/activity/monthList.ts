import { nextMonth, toISOMonth } from '../../shared/date'
import { keys } from '../../shared/keys'
import type { ByMonth } from '../../shared/types'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TTransaction } from '../../zenmoney/transactions/types'
import type { TEnvelopeId } from '../envelope-id'

export type TBuildMonthListInput = {
  transactions: TTransaction[]
  budgets: ByMonth<Record<TEnvelopeId, number>>
  currentMonth: TISOMonth
}

export function buildMonthList(input: TBuildMonthListInput): TISOMonth[] {
  const start = toISOMonth(input.transactions[0]?.date || input.currentMonth)
  const lastBudgetMonth = keys(input.budgets).sort().pop() || input.currentMonth
  const lastMonth =
    lastBudgetMonth > input.currentMonth ? lastBudgetMonth : input.currentMonth
  const end = toISOMonth(nextMonth(lastMonth))

  const result: TISOMonth[] = []
  let current: TISOMonth = start
  do {
    result.push(current)
    current = toISOMonth(nextMonth(current))
  } while (current <= end)

  return result
}
