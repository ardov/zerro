import { userModel } from '5-entities/user'
import { TISOMonth, TTagId } from '6-shared/types'
import { applyClientPatch } from 'store/data'
import { AppThunk } from 'store/index'
import { getTagBudgetId } from './getBudgetId'
import { makeTagBudget } from './makeTagBudget'
import { getTagBudgets } from './selectors'

export type TTagBudgetUpdate = {
  tag: TTagId | null
  month: TISOMonth
  value: number
}

export function setTagBudget(
  upd: TTagBudgetUpdate | TTagBudgetUpdate[]
): AppThunk {
  return (dispatch, getState) => {
    const updates = Array.isArray(upd) ? upd : [upd]
    if (!upd || !updates.length) return null

    const state = getState()
    const userId = userModel.getRootUserId(state)
    const tagBudgets = getTagBudgets(state)

    const budgets = updates.map(({ tag, month, value }) => {
      const id = getTagBudgetId(month, tag)
      const current = tagBudgets[id] || {}
      return makeTagBudget({
        ...current,
        user: current.user || userId,
        tag: tag,
        date: month,
        outcome: value,
        changed: Date.now(),
      })
    })
    dispatch(applyClientPatch({ budget: budgets }))
  }
}
