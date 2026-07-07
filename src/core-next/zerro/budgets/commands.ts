import type { ByMonth, TDataStore, TISOMonth } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import { applyPatch } from '../../zenmoney'
import type { TEnvelopeId } from '../envelope-id'
import {
  compileSetMonthlyHiddenData,
  HiddenDataType,
  mergeNormalizedPatches,
} from '../hidden-data'
import { getEnvBudgets, type TBudgets } from './read'

export type TEnvBudgetUpdate = {
  id: TEnvelopeId
  month: TISOMonth
  value: number
}

export function compileSetEnvBudget(
  data: TDataStore,
  update: TEnvBudgetUpdate | TEnvBudgetUpdate[],
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TNormalizedPatch {
  const updates = Array.isArray(update) ? update : [update]
  if (!updates.length) return {}

  const currentBudgets = getEnvBudgets(data)
  const byMonth: ByMonth<TBudgets> = {}

  updates.forEach(({ id, month, value }) => {
    byMonth[month] ??= currentBudgets[month]
      ? { ...currentBudgets[month] }
      : {}

    if (value) byMonth[month][id] = value
    else delete byMonth[month][id]
  })

  let state = data
  const patches = Object.entries(byMonth).map(([month, payload]) => {
    const patch = compileSetMonthlyHiddenData(
      state,
      HiddenDataType.Budgets,
      payload,
      month as TISOMonth,
      ctx
    )
    state = applyPatch(state, patch)
    return patch
  })

  return mergeNormalizedPatches(...patches)
}
