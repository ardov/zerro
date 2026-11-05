import type { TDataStore } from '../../zenmoney/model/store'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TCoreContext } from '../../../../types'
import type { TEnvelopeId } from '../envelope-id'
import { getUserSettings } from '../user-settings'
import { prepareZerro } from '../operations/prepare'
export type TEnvBudgetUpdate = {
  id: TEnvelopeId
  month: TISOMonth
  value: number
}
export type TBudgetUpdate = TEnvBudgetUpdate
export function compileSetBudget(
  data: TDataStore,
  update: TBudgetUpdate | TBudgetUpdate[],
  ctx: TCoreContext
) {
  return prepareBudgets(
    data,
    update,
    ctx,
    getUserSettings(data.reminder).preferZmBudgets
  )
}
export function compileSetEnvBudget(
  data: TDataStore,
  update: TEnvBudgetUpdate | TEnvBudgetUpdate[],
  ctx: TCoreContext
) {
  return prepareBudgets(data, update, ctx, false)
}
function prepareBudgets(
  data: TDataStore,
  update: TBudgetUpdate | TBudgetUpdate[],
  ctx: TCoreContext,
  nativeTags: boolean
) {
  const months = new Map<TISOMonth, Map<TEnvelopeId, number>>()
  for (const row of Array.isArray(update) ? update : [update]) {
    const values = months.get(row.month) ?? new Map<TEnvelopeId, number>()
    values.set(row.id, row.value)
    months.set(row.month, values)
  }
  return prepareZerro(
    data,
    [...months].map(([month, values]) => ({
      type: 'budgets.set',
      month,
      nativeTags,
      values: [...values].map(([envelopeId, amount]) => ({
        envelopeId,
        amount,
      })),
    })),
    ctx
  )
}
