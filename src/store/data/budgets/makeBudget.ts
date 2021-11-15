import { Budget, OptionalExceptFor } from 'types'

type BudgetDraft = OptionalExceptFor<Budget, 'user' | 'date' | 'tag'>

export const makeBudget = ({
  user,
  date,
  tag,
  changed = Date.now(),
  income = 0,
  incomeLock = true,
  outcome = 0,
  outcomeLock = true,
}: BudgetDraft): Budget => ({
  user,
  date,
  tag: tag === 'null' ? null : tag,
  changed,
  income,
  incomeLock,
  outcome,
  outcomeLock,
})
