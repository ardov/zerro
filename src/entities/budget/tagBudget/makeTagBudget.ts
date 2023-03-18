import { parseDate, toISODate } from '@shared/helpers/date'
import { TBudget } from '@shared/types'
import { OptionalExceptFor, Modify, TDateDraft } from '@shared/types'
import { getTagBudgetId } from './getBudgetId'

export type TTagBudgetDraft = Modify<
  OptionalExceptFor<TBudget, 'user' | 'date' | 'tag'>,
  { date: TDateDraft }
>

export const makeTagBudget = (draft: TTagBudgetDraft): TBudget => ({
  id: getTagBudgetId(draft.date, draft.tag),
  user: draft.user,
  date: toISODate(parseDate(draft.date)),
  tag: draft.tag || null,
  changed: draft.changed || Date.now(),
  income: draft.income || 0,
  incomeLock: draft.incomeLock || true,
  outcome: draft.outcome || 0,
  outcomeLock: draft.outcomeLock || true,
})
