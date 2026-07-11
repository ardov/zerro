import { setBudget as setCoreBudget } from 'core-next/adapters/redux'
import { AppThunk } from 'store/index'
import { TEnvBudgetUpdate } from './envBudget'

export type TBudgetUpdate = TEnvBudgetUpdate

export function setBudget(upd: TBudgetUpdate | TBudgetUpdate[]): AppThunk {
  return setCoreBudget(Array.isArray(upd) ? upd : [upd])
}
