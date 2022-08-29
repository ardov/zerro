import { AppThunk } from '@store'
import { applyClientPatch } from '@store/data'
import { getRootUser } from '@models/user'
import { IBudget, OptionalExceptFor, TISOMonth, TTagId } from '@shared/types'
import { getBudgets } from './selectors'
import { BudgetDraft, makeBudget } from './makeBudget'
import { getBudgetId } from './getBudgetId'
import { toISODate } from '@shared/helpers/date'

type BudgetPatchId = OptionalExceptFor<IBudget, 'id'>
type BudgetPatchTagDate = OptionalExceptFor<IBudget, 'tag' | 'date'>

type Draft = BudgetDraft | BudgetPatchId | BudgetPatchTagDate

export const setBudget =
  (draft: Draft | Array<Draft>): AppThunk<IBudget[]> =>
  (dispatch, getState) => {
    const arr = Array.isArray(draft) ? draft : [draft]
    const state = getState()

    const readyBudgets = arr.map(el => {
      let id = el.id || getBudgetId(el.date, el.tag)
      const currentBudget = getBudgets(state)[id] || ({} as IBudget)
      const patched = {
        ...currentBudget,
        ...el,
        changed: el.changed || Date.now(),
      }
      if (!patched.user) {
        const userId = getRootUser(state)?.id
        if (!userId) {
          throw new Error('User is not defined')
        }
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
  (date: TISOMonth, tag: TTagId | null, budget: number): AppThunk<IBudget[]> =>
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
