import { createSelector } from '@reduxjs/toolkit'
import { toISOMonth } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { withPerf } from '@shared/helpers/performance'
import { TSelector } from '@store/index'
import { ByMonth, DataEntity, TEnvelopeId } from '@shared/types'
import { envelopeModel } from '@entities/envelope'
import { userSettingsModel } from '@entities/userSettings'
import { getTagBudgets } from './tagBudget'
import { getEnvBudgets } from './envBudget'

export const getBudgets: TSelector<ByMonth<Record<TEnvelopeId, number>>> =
  createSelector(
    [getTagBudgets, getEnvBudgets, userSettingsModel.get],
    withPerf(
      'getEnvelopeBudgets',
      (tagBudgets, hiddenBudgets, userSettings) => {
        const result: ByMonth<Record<TEnvelopeId, number>> = {}

        if (userSettings.preferZmBudgets) {
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
      }
    )
  )
