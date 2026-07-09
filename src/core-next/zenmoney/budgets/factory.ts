import { toISODate } from '../../shared/date'
import type { Modify, OptionalExceptFor } from '../../shared/types'
import type { TCoreContext } from '../../types'
import type { TDateDraft } from '../primitives'
import { toBudgetId } from './id'
import type { TBudget } from './types'

export type TTagBudgetFactoryDraft = Modify<
  OptionalExceptFor<TBudget, 'user' | 'date' | 'tag'>,
  { date: TDateDraft }
>

export function makeTagBudget(
  draft: TTagBudgetFactoryDraft,
  ctx: Pick<TCoreContext, 'now'>
): TBudget {
  return {
    id: toBudgetId(draft.date, draft.tag),
    user: draft.user,
    date: toISODate(draft.date),
    tag: draft.tag || null,
    changed: draft.changed || ctx.now(),
    income: draft.income || 0,
    incomeLock: draft.incomeLock || true,
    outcome: draft.outcome || 0,
    outcomeLock: draft.outcomeLock || true,
  }
}
