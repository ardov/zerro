import type { ById, TDataStore } from '6-shared/types'
import type { TBudget } from './types'

export function getTagBudgets(data: Pick<TDataStore, 'budget'>): ById<TBudget> {
  return data.budget
}
