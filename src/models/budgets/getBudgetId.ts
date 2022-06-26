import { toISODate } from 'shared/helpers/adapterUtils'
import { TBudgetId, TDateDraft, TISOMonth, TTagId } from 'shared/types'

export function getBudgetId(date: TDateDraft, tag: TTagId | null): TBudgetId {
  return `${toISODate(date)}#${tag}`
}

export function getISOMonthFromBudgetId(id: TBudgetId): TISOMonth {
  return id.slice(0, 7) as TISOMonth
}
