import { createSelector } from '@reduxjs/toolkit'
import { getBudgets } from 'models/budget'
import { getEnvelopeId, TEnvelopeId } from 'models/shared/envelopeHelpers'
import { toISOMonth } from 'shared/helpers/date'
import { keys } from 'shared/helpers/keys'
import { DataEntity, TISOMonth } from 'shared/types'

// TODO: write normal function
const getHiddenBudgets = () =>
  ({} as Record<TISOMonth, Record<TEnvelopeId, number>>)

export const getEnvelopeBudgets = createSelector(
  [getBudgets, getHiddenBudgets],
  (tagBudgets, hiddenBudgets) => {
    const result: Record<TISOMonth, Record<TEnvelopeId, number>> = {}

    keys(tagBudgets).forEach(id => {
      const budget = tagBudgets[id]
      const date = toISOMonth(budget.date)
      const value = budget.outcome
      const envelopeId = getEnvelopeId(DataEntity.Tag, String(budget.tag))
      result[date] ??= {}
      result[date][envelopeId] = value
    })

    keys(hiddenBudgets).forEach(date => {
      keys(hiddenBudgets[date]).forEach(envelopeId => {
        result[date] ??= {}
        result[date][envelopeId] = hiddenBudgets[date][envelopeId]
      })
    })

    return result
  }
)
