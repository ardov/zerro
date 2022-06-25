import { msToISODate } from 'shared/helpers/adapterUtils'
import { TBudget, OptionalExceptFor } from 'shared/types'

type BudgetDraft = OptionalExceptFor<TBudget, 'user' | 'date' | 'tag'>

export const makeBudget = ({
  user,
  date,
  tag = null,
  changed = Date.now(),
  income = 0,
  incomeLock = true,
  outcome = 0,
  outcomeLock = true,
}: BudgetDraft): TBudget => ({
  user,
  date,
  tag,
  changed,
  income,
  incomeLock,
  outcome,
  outcomeLock,
  // TODO: decouple this logic
  id: `${msToISODate(date)}#${tag}`,
})
