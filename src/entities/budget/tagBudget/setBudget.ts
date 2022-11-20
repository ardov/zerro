import { AppThunk } from '@store'
import { applyClientPatch } from '@store/data'
import { userModel } from '@entities/user'
import { TBudget, OptionalExceptFor, TISOMonth, TTagId } from '@shared/types'
import { getBudgets } from './selectors'
import { BudgetDraft, makeBudget } from './makeBudget'
import { getBudgetId } from './getBudgetId'
import { toISODate } from '@shared/helpers/date'

type BudgetPatchId = OptionalExceptFor<TBudget, 'id'>
type BudgetPatchTagDate = OptionalExceptFor<TBudget, 'tag' | 'date'>

type Draft = BudgetDraft | BudgetPatchId | BudgetPatchTagDate

export const setBudget =
  (draft: Draft | Array<Draft>): AppThunk<TBudget[]> =>
  (dispatch, getState) => {
    const arr = Array.isArray(draft) ? draft : [draft]
    const state = getState()

    const readyBudgets = arr.map(el => {
      let id = el.id || getBudgetId(el.date, el.tag)
      const currentBudget = getBudgets(state)[id] || ({} as TBudget)
      const patched = {
        ...currentBudget,
        ...el,
        changed: el.changed || Date.now(),
      }
      if (!patched.user) {
        const userId = userModel.getRootUserId(state)
        if (!userId) throw new Error('User is not defined')
        patched.user = userId
      }
      if (!patched.tag) {
        patched.tag = null
      }
      if (!patched.date) {
        throw new Error('No date provided')
      }
      return makeBudget(patched)
    })

    dispatch(applyClientPatch({ budget: readyBudgets }))
    return readyBudgets
  }

export const setOneBudget =
  (date: TISOMonth, tag: TTagId | null, budget: number): AppThunk<TBudget[]> =>
  dispatch => {
    return dispatch(
      setBudget({
        date: toISODate(date),
        tag,
        outcome: budget,
        outcomeLock: true,
      })
    )
  }
