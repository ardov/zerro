import { toISODate } from '../../shared/date'
import type { TDataStore } from '../store'
import type { TISOMonth } from '../primitives'
import type { TIntentPatch } from '../../../types'
import type { TTagId } from '../tags'
import { toBudgetId } from './id'

export type TTagBudgetUpdate = {
  tag: TTagId | null
  month: TISOMonth
  value: number
}

export function compileSetTagBudget(
  data: TDataStore,
  update: TTagBudgetUpdate | TTagBudgetUpdate[]
): TIntentPatch {
  const updates = Array.isArray(update) ? update : [update]
  if (!updates.length) return {}

  return {
    budget: updates.map(({ tag, month, value }) => ({
      id: toBudgetId(month, tag),
      tag,
      date: toISODate(month),
      outcome: value,
    })),
  }
}
