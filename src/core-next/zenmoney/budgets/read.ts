import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TBudget } from './types'

export function getTagBudgets(data: Pick<TDataStore, 'budget'>): ById<TBudget> {
  return data.budget
}
