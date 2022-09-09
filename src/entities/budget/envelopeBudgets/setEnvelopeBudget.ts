import {
  DataEntity,
  TBudget,
  TEnvelopeId,
  TISOMonth,
  TTagId,
} from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { AppThunk } from '@store'
import { applyClientPatch } from '@store/data'
import { parseEnvelopeId } from '@entities/envelope'
import { getRootUser } from '@entities/user'
import { getBudgetId, getBudgets, makeBudget } from '../tagBudget'
import { budgetStore } from './budgetStore'

export type TBudgetUpdate = {
  id: TEnvelopeId
  month: TISOMonth
  value: number
}

export const setEnvelopeBudgets =
  (upd: TBudgetUpdate | TBudgetUpdate[]): AppThunk<void> =>
  (dispatch, getState) => {
    const state = getState()
    const updates = Array.isArray(upd) ? upd : [upd]

    // TODO: calculate self budgets

    const tagUpdates: { id: TTagId | null; month: TISOMonth; value: number }[] =
      []
    const envelopeUpdates: Record<TISOMonth, Record<TEnvelopeId, number>> = {}

    updates.forEach(update => {
      const { type, id } = parseEnvelopeId(update.id)
      if (type === DataEntity.Tag) {
        tagUpdates.push({
          id: id === 'null' ? null : id,
          month: update.month,
          value: update.value,
        })
      } else {
        envelopeUpdates[update.month] = {
          ...envelopeUpdates[update.month],
          [update.id]: update.value,
        }
      }
    })

    // Process tag budgets
    const readyBudgets = tagUpdates.map(update => {
      let id = getBudgetId(update.month, update.id)
      const currentBudget = getBudgets(state)[id] || ({} as TBudget)
      const patched = {
        ...currentBudget,
        tag: update.id,
        date: update.month,
        outcome: update.value,
        changed: Date.now(),
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

    // Process envelope budgets
    const curentEnvelopeBudgets = budgetStore.getData(getState())
    keys(envelopeUpdates).forEach(month => {
      const currentData = curentEnvelopeBudgets[month] || {}
      const newData = { ...currentData, ...envelopeUpdates[month] }
      dispatch(budgetStore.setData(newData, month))
    })
  }
