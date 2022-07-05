import { createSelector } from '@reduxjs/toolkit'
import { TInstrumentId } from 'shared/types'
import { TEnvelopeId, TEnvelopeType } from 'models/shared/envelopeHelpers'
import { getMonthDates } from 'pages/Budgets/selectors'
import { TISOMonth } from 'shared/types'
import { getEnvelopes } from './getEnvelopes'
import { getMoneyFlow } from './getMoneyFlow'
import { TFxAmount } from './helpers/fxAmount'

export type TEnvelopeBudgets = {
  // Money amounts for month
  fundsStart: TFxAmount
  fundsChange: TFxAmount
  fundsEnd: TFxAmount

  // Envelopes
  envelopes: {
    [id: TEnvelopeId]: {
      id: TEnvelopeId
      type: TEnvelopeType
      entityId: string
      comment: string
      currency: TInstrumentId
      keepIncome: boolean
      carryNegatives: boolean

      parent: TEnvelopeId | null
      children: TEnvelopeId[]

      leftover: number
      budgeted: TFxAmount
      outcome: TFxAmount
      income: TFxAmount // will be counted if keepIncome === true
      available: number
      overspend: number // if available is negative
    }
  }
}

// export getEnvelopeBudgets = createSelector([getMonthDates,getEnvelopes,getMoneyFlow],(monthList, envelopes, moneyFlow)=>{
//   const result: Record<TISOMonth, TEnvelopeBudgets> = {}
// })
