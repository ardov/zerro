import { createSelector } from '@reduxjs/toolkit'
import { toISOMonth } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { ByMonth, DataEntity, TEnvelopeId } from '@shared/types'
import { getEnvelopeId } from '@entities/envelope'
import { getBudgets } from '../tagBudget'
import { budgetStore } from './budgetStore'
import { withPerf } from '@shared/helpers/performance'

export const getEnvelopeBudgets = createSelector(
  [getBudgets, budgetStore.getData],
  withPerf('getEnvelopeBudgets', (tagBudgets, hiddenBudgets) => {
    const result: ByMonth<Record<TEnvelopeId, number>> = {}

    keys(tagBudgets).forEach(id => {
      const budget = tagBudgets[id]
      if (!budget.outcome) return
      const month = toISOMonth(budget.date)
      const envId = getEnvelopeId(DataEntity.Tag, String(budget.tag))
      result[month] ??= {}
      result[month][envId] = budget.outcome
    })

    keys(hiddenBudgets).forEach(month => {
      keys(hiddenBudgets[month]).forEach(envId => {
        if (!hiddenBudgets[month][envId]) return
        result[month] ??= {}
        result[month][envId] = hiddenBudgets[month][envId]
      })
    })

    return result
  })
)
