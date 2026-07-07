import type { ByMonth, TDataStore, TISOMonth } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import { applyPatch, compileSetTagBudget, type TTagBudgetUpdate } from '../../zenmoney'
import { EnvType, envId, type TEnvelopeId } from '../envelope-id'
import {
  compileSetMonthlyHiddenData,
  HiddenDataType,
  mergeNormalizedPatches,
} from '../hidden-data'
import { getUserSettings } from '../user-settings'
import { getEnvBudgets, type TBudgets } from './read'

export type TEnvBudgetUpdate = {
  id: TEnvelopeId
  month: TISOMonth
  value: number
}

export type TBudgetUpdate = TEnvBudgetUpdate

export function compileSetBudget(
  data: TDataStore,
  update: TBudgetUpdate | TBudgetUpdate[],
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TNormalizedPatch {
  const updates = Array.isArray(update) ? update : [update]
  if (!updates.length) return {}

  const preferZmBudgets = getUserSettings(data).preferZmBudgets
  const tagUpdates: TTagBudgetUpdate[] = []
  const envUpdates: TEnvBudgetUpdate[] = []

  updates.forEach(item => {
    const parsed = envId.parse(item.id)
    if (parsed.type === EnvType.Tag && preferZmBudgets) {
      tagUpdates.push({
        tag: parsed.id === 'null' ? null : parsed.id,
        month: item.month,
        value: item.value,
      })
    } else {
      envUpdates.push(item)
    }
  })

  return mergeNormalizedPatches(
    tagUpdates.length ? compileSetTagBudget(data, tagUpdates, ctx) : {},
    envUpdates.length ? compileSetEnvBudget(data, envUpdates, ctx) : {}
  )
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
