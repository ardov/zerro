import {
  ByMonth,
  DataEntity,
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
import { getMonthTotals } from '@entities/envelopeData'
import { convertFx, sub } from '@shared/helpers/money'

export type TEnvBudgetUpdate = {
  id: TEnvelopeId
  month: TISOMonth
  value: number
}

export function setEnvelopeBudgets(
  upd: TEnvBudgetUpdate | TEnvBudgetUpdate[]
): AppThunk {
  return (dispatch, getState) => {
    const updates = Array.isArray(upd) ? upd : [upd]
    const totals = getMonthTotals(getState())

    const tagUpdates: TTagBudgetUpdate[] = []
    const envelopeUpdates: TEnvBudgetUpdate[] = []

    updates.map(adjustValue).forEach(update => {
      const { type, id } = parseEnvelopeId(update.id)
      if (type === DataEntity.Tag) {
        tagUpdates.push({
          tag: id === 'null' ? null : id,
          month: update.month,
          value: update.value,
        })
      } else {
        envelopeUpdates.push(update)
      }
    })

    dispatch(setTagBudget(tagUpdates))
    dispatch(setEnvBudget(envelopeUpdates))

    /**
     * Adjusts budget depending on children budgets.
     */
    function adjustValue(u: TEnvBudgetUpdate): TEnvBudgetUpdate {
      const monthTotals = totals[u.month]
      if (!monthTotals) return u
      const { childrenBudgeted } = monthTotals.envelopes[u.id]
      const { currency } = monthTotals.envelopes[u.id].env
      const rates = monthTotals.rates
      const childrenValue = convertFx(childrenBudgeted, currency, rates)
      return { ...u, value: sub(u.value, childrenValue) }
    }
  }
}

function setEnvBudget(upd: TEnvBudgetUpdate | TEnvBudgetUpdate[]): AppThunk {
  return (dispatch, getState) => {
    const updates = Array.isArray(upd) ? upd : [upd]
    if (!upd || !updates.length) return null

    let byMonth: ByMonth<Record<TEnvelopeId, number>> = {}
    updates.forEach(({ id, month, value }) => {
      byMonth[month] ??= {}
      byMonth[month][id] = value
    })
    const curentBudgets = budgetStore.getData(getState())
    keys(byMonth).forEach(month => {
      const currentData = curentBudgets[month] || {}
      const newData = { ...currentData, ...byMonth[month] }
      dispatch(budgetStore.setData(newData, month))
    })
  }
}

type TTagBudgetUpdate = {
  tag: TTagId | null
  month: TISOMonth
  value: number
}

function setTagBudget(upd: TTagBudgetUpdate | TTagBudgetUpdate[]): AppThunk {
  return (dispatch, getState) => {
    const updates = Array.isArray(upd) ? upd : [upd]
    if (!upd || !updates.length) return null

    const state = getState()
    const userId = getRootUser(state)?.id
    if (!userId) throw new Error('User is not defined')

    const budgets = updates.map(({ tag, month, value }) => {
      const id = getBudgetId(month, tag)
      const current = getBudgets(state)[id] || {}
      return makeBudget({
        ...current,
        tag: tag,
        date: month,
        user: current.user || userId,
        outcome: value,
        changed: Date.now(),
      })
    })
    dispatch(applyClientPatch({ budget: budgets }))
  }
}
