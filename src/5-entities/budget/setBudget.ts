import { v1 as uuidv1 } from 'uuid'
import { compileSetBudget } from 'core-next/zerro/budgets'
import { applyClientPatch } from 'store/data'
import { AppThunk } from 'store/index'
import { TEnvBudgetUpdate } from './envBudget'

export type TBudgetUpdate = TEnvBudgetUpdate

export function setBudget(upd: TBudgetUpdate | TBudgetUpdate[]): AppThunk {
  return (dispatch, getState) => {
    const patch = compileSetBudget(getState().data.current, upd, {
      now: Date.now,
      uuid: uuidv1,
    })

    if (Object.keys(patch).length) dispatch(applyClientPatch(patch))
  }
}
