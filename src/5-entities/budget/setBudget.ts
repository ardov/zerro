import { executeCommand } from 'core-next/adapters/redux'
import { AppThunk } from 'store/index'
import { TEnvBudgetUpdate } from './envBudget'

export type TBudgetUpdate = TEnvBudgetUpdate

export function setBudget(upd: TBudgetUpdate | TBudgetUpdate[]): AppThunk {
  return executeCommand({
    v: 1,
    type: 'zerro.budget.set',
    payload: Array.isArray(upd) ? upd : [upd],
  })
}
