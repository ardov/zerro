import { nextMonth, toISOMonth } from '../../foundation/date'
import { keys } from '../../foundation/keys'
import type { ByMonth } from '../../foundation/types'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TTransaction } from '../../zenmoney/entities/transactions/types'
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
