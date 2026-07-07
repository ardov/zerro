import { toISODate } from '6-shared/helpers/date'
import type { TDateDraft } from '../primitives'
import type { TBudgetId, TBudgetTagId } from './types'

export function toBudgetId(date: TDateDraft, tag: TBudgetTagId): TBudgetId {
  return `${toISODate(date)}#${tag}` as TBudgetId
}

export const getTagBudgetId = toBudgetId
