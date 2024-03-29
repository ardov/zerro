import { createSelector } from '@reduxjs/toolkit'
import { toISOMonth } from '6-shared/helpers/date'
import { keys } from '6-shared/helpers/keys'
import { withPerf } from '6-shared/helpers/performance'
import { ByMonth } from '6-shared/types'
import { TSelector } from 'store/index'
import { envelopeModel, EnvType } from '5-entities/envelope'
import { userSettingsModel } from '5-entities/userSettings'
import { getTagBudgets } from './tagBudget'
import { getEnvBudgets, TBudgets } from './envBudget'

export const getBudgets: TSelector<ByMonth<TBudgets>> = createSelector(
  [getTagBudgets, getEnvBudgets, userSettingsModel.get],
  withPerf('getEnvelopeBudgets', (tagBudgets, hiddenBudgets, userSettings) => {
    const { preferZmBudgets } = userSettings
    const result: ByMonth<TBudgets> = {}

    if (preferZmBudgets) {
      keys(tagBudgets).forEach(budgetId => {
        const budget = tagBudgets[budgetId]
        if (!budget.outcome) return
        const month = toISOMonth(budget.date)
        const envelopeId = envelopeModel.makeId(EnvType.Tag, String(budget.tag))
        result[month] ??= {}
        result[month][envelopeId] = budget.outcome
      })
    }

    keys(hiddenBudgets).forEach(month => {
      keys(hiddenBudgets[month]).forEach(envelopeId => {
        if (preferZmBudgets) {
          // Skip Zerro tag budgets if user prefers Zenmoney budgets
          const { type } = envelopeModel.parseId(envelopeId)
          if (type === EnvType.Tag) return
        }
        if (!hiddenBudgets[month][envelopeId]) return
        result[month] ??= {}
        result[month][envelopeId] = hiddenBudgets[month][envelopeId]
      })
    })

    return result
  })
)
