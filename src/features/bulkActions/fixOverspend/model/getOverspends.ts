import { createSelector } from '@reduxjs/toolkit'
import { TFxAmount, TISOMonth } from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { addFxAmount, convertFx } from '@shared/helpers/money'
import { getMonthTotals, TMonthTotals } from '@entities/envelopeData'
import { TSelector } from '@store'

type TOverspends = ReturnType<typeof calculateOverspends>

export const getOverspendsByMonth: TSelector<Record<TISOMonth, TOverspends>> =
  createSelector([getMonthTotals], totals => {
    const result: Record<TISOMonth, TOverspends> = {}
    keys(totals).forEach(month => {
      result[month] = calculateOverspends(totals[month])
    })
    return result
  })

function calculateOverspends(monthInfo: TMonthTotals) {
  const { envelopes, currency, rates } = monthInfo
  const overspendingParents = Object.values(envelopes).filter(
    envelope => !envelope.env.parent && envelope.selfAvailableValue < 0
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
