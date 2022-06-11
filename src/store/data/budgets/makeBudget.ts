import { TBudget, OptionalExceptFor } from 'types'

type BudgetDraft = OptionalExceptFor<TBudget, 'user' | 'date' | 'tag'>

export const makeBudget = ({
  user,
  date,
  tag,
  changed = Date.now(),
  income = 0,
  incomeLock = true,
  outcome = 0,
  outcomeLock = true,
}: BudgetDraft): TBudget => ({
  user,
  date,
  tag: tag === 'null' ? null : tag,
  changed,
  income,
  incomeLock,
  outcome,
  outcomeLock,
})
