import { parseDate, toISODate } from 'shared/helpers/date'
import { TBudget } from 'shared/types'
import { OptionalExceptFor, Modify, TDateDraft } from 'shared/types'
import { getBudgetId } from './getBudgetId'

type BudgetDraft = Modify<
  OptionalExceptFor<TBudget, 'user' | 'date' | 'tag'>,
  { date: TDateDraft }
>

export const makeBudget = (draft: BudgetDraft): TBudget => ({
  id: getBudgetId(draft.date, draft.tag),
  user: draft.user,
  date: toISODate(parseDate(draft.date)),
  tag: draft.tag || null,
  changed: draft.changed || Date.now(),
  income: draft.income || 0,
  incomeLock: draft.incomeLock || true,
  outcome: draft.outcome || 0,
  outcomeLock: draft.outcomeLock || true,
})
