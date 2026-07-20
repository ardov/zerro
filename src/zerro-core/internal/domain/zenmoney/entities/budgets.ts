import { toISODate } from '../../foundation/date'
import type {
  ById,
  EntityPatch,
  Modify,
  OptionalExceptFor,
} from '../../foundation/types'
import type { TCoreContext } from '../../../../types'
import type {
  TDateDraft,
  TISODate,
  TISOMonth,
  TMsTime,
  TUnixTime,
  TUnits,
} from '../../foundation/primitives'
import type { TTagId } from './tags'
import type { TUserId } from './users'

export type TBudgetId = `${TISODate}#${TTagId}`
export const globalBudgetTagId = '00000000-0000-0000-0000-000000000000'
export type TGlobalBudgetTagId = typeof globalBudgetTagId
export type TBudgetTagId = TTagId | TGlobalBudgetTagId | null
export type TBudget = {
  id: TBudgetId
  changed: TMsTime
  user: TUserId
  tag: TBudgetTagId
  date: TISODate
  income: TUnits
  incomeLock: boolean
  isIncomeForecast: boolean
  outcome: TUnits
  outcomeLock: boolean
  isOutcomeForecast: boolean
}
/** Fields the factory cannot default: creation intent must supply them. */
export const budgetRequiredFields = [
  'tag',
  'date',
] as const satisfies readonly (keyof TBudget)[]

export const budgetWritableFields = [
  'tag',
  'date',
  'income',
  'incomeLock',
  'isIncomeForecast',
  'outcome',
  'outcomeLock',
  'isOutcomeForecast',
] as const satisfies readonly (keyof TBudget)[]
export type TBudgetWritableField = (typeof budgetWritableFields)[number]
export type TBudgetPatch = EntityPatch<TBudget, TBudgetWritableField>
export type TZmBudget = Omit<TBudget, 'id' | 'changed'> & { changed: TUnixTime }
export type TTagBudgetFactoryDraft = Modify<
  OptionalExceptFor<TBudget, 'user' | 'date' | 'tag'>,
  { date: TDateDraft }
>
export type TTagBudgetUpdate = {
  tag: TTagId | null
  month: TISOMonth
  value: number
}

export function toBudgetId(date: TDateDraft, tag: TBudgetTagId): TBudgetId {
  return `${toISODate(date)}#${tag}` as TBudgetId
}
export type TBudgetSource = { budget: ById<TBudget> }
export type TBudgetIntent = { budget?: TBudgetPatch[] }

export function getTagBudgets(data: TBudgetSource): ById<TBudget> {
  return data.budget
}
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
    incomeLock: draft.incomeLock ?? true,
    isIncomeForecast: draft.isIncomeForecast ?? false,
    outcome: draft.outcome || 0,
    outcomeLock: draft.outcomeLock ?? true,
    isOutcomeForecast: draft.isOutcomeForecast ?? false,
  }
}
export function compileSetTagBudget(
  _data: unknown,
  update: TTagBudgetUpdate | TTagBudgetUpdate[]
): TBudgetIntent {
  const updates = Array.isArray(update) ? update : [update]
  return updates.length
    ? {
        budget: updates.map(({ tag, month, value }) => ({
          id: toBudgetId(month, tag),
          tag,
          date: toISODate(month),
          outcome: value,
        })),
      }
    : {}
}
