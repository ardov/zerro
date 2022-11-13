import { createSelector } from '@reduxjs/toolkit'
import { toISOMonth } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { ByMonth, DataEntity, TEnvelopeId } from '@shared/types'
import { envId } from '@entities/envelope'
import { getBudgets } from '../tagBudget'
import { budgetStore } from './budgetStore'
import { withPerf } from '@shared/helpers/performance'

export const getEnvelopeBudgets = createSelector(
  [getBudgets, budgetStore.getData],
  withPerf('getEnvelopeBudgets', (tagBudgets, hiddenBudgets) => {
    const result: ByMonth<Record<TEnvelopeId, number>> = {}

    keys(tagBudgets).forEach(budgetId => {
      const budget = tagBudgets[budgetId]
      if (!budget.outcome) return
      const month = toISOMonth(budget.date)
      const envelopeId = envId.get(DataEntity.Tag, String(budget.tag))
      result[month] ??= {}
      result[month][envelopeId] = budget.outcome
    })

    keys(hiddenBudgets).forEach(month => {
      keys(hiddenBudgets[month]).forEach(envelopeId => {
        if (!hiddenBudgets[month][envelopeId]) return
        result[month] ??= {}
        result[month][envelopeId] = hiddenBudgets[month][envelopeId]
      })
    })

    return result
  })
)
