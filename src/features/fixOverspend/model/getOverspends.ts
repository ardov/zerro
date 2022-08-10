import { createSelector } from '@reduxjs/toolkit'
import { getMonthTotals } from 'models/envelopeData'
import { TMonthTotals } from 'models/envelopeData/getMonthTotals'
import { addFxAmount, convertFx } from 'shared/helpers/money'
import { keys } from 'shared/helpers/keys'
import { TFxAmount, TISOMonth } from 'shared/types'

type TOverspends = ReturnType<typeof calculateOverspends>

export const getOverspendsByMonth = createSelector([getMonthTotals], totals => {
  const result: Record<TISOMonth, TOverspends> = {}
  keys(totals).forEach(month => {
    result[month] = calculateOverspends(totals[month])
  })
  return result
})

function calculateOverspends(monthInfo: TMonthTotals) {
  const { envelopes, currency, rates } = monthInfo
  const overspendingParents = Object.values(envelopes).filter(
    envelope => !envelope.parent && envelope.selfAvailableValue < 0
  )
  const totalOverspend = overspendingParents.reduce(
    (acc, envelope) => addFxAmount(acc, envelope.selfAvailable),
    {} as TFxAmount
  )
  const totalOverspendValue = convertFx(totalOverspend, currency, rates)
  return {
    totalOverspend,
    totalOverspendValue,
    currency,
    envelopes: overspendingParents,
  }
}
