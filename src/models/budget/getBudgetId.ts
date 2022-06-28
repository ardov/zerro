import { TTagId } from 'models/tag'
import { toISODate } from 'shared/helpers/date'
import { TDateDraft, TISOMonth } from 'shared/types'
import { TBudgetId } from './types'

export function getBudgetId(date: TDateDraft, tag: TTagId | null): TBudgetId {
  return `${toISODate(date)}#${tag}`
}

export function getISOMonthFromBudgetId(id: TBudgetId): TISOMonth {
  return id.slice(0, 7) as TISOMonth
}
