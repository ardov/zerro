import { createSelector } from '@reduxjs/toolkit'
import { TDateDraft, TFxAmount, TFxCode } from '@shared/types'
import { convertFx } from '@shared/helpers/money'

import { TSelector } from '@store'
import { getFxRatesGetter } from './getFxRatesGetter'

export const getConverter: TSelector<
  (amount: TFxAmount, target: TFxCode, date: TDateDraft | 'current') => number
> = createSelector([getFxRatesGetter], getter => {
  return (amount: TFxAmount, target: TFxCode, date: TDateDraft | 'current') =>
    convertFx(amount, target, getter(date).rates)
})
