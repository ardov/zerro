import { createSelector } from '@reduxjs/toolkit'
import { toISOMonth } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { ByMonth, DataEntity, TEnvelopeId } from '@shared/types'
import { envelopeModel } from '@entities/envelope'
import { getBudgets } from '../tagBudget'
import { budgetStore } from './budgetStore'
import { withPerf } from '@shared/helpers/performance'
import { userSettingsModel } from '@entities/userSettings'

export const getEnvelopeBudgets = createSelector(
  [getBudgets, budgetStore.getData, userSettingsModel.getUserSettings],
  withPerf('getEnvelopeBudgets', (tagBudgets, hiddenBudgets, userSettings) => {
    const result: ByMonth<Record<TEnvelopeId, number>> = {}

    if (userSettings.useZmBudgets) {
      keys(tagBudgets).forEach(budgetId => {
        const budget = tagBudgets[budgetId]
        if (!budget.outcome) return
        const month = toISOMonth(budget.date)
        const envelopeId = envelopeModel.makeId(
          DataEntity.Tag,
          String(budget.tag)
        )
        result[month] ??= {}
        result[month][envelopeId] = budget.outcome
      })
    }

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
