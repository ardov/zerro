import type { TBudgetId, TTagId, TISODate } from '6-shared/types'

export const toBudgetId = (date: TISODate, tag: TTagId | null): TBudgetId =>
  `${date}#${tag}`
