import { createSelector } from '@reduxjs/toolkit'
import { TDateDraft, TFxAmount, TFxCode } from '6-shared/types'
import { convertFx } from '6-shared/helpers/money'

import { TSelector } from 'store'
import { getFxRatesGetter } from './getFxRatesGetter'

export type TFxConverter = (
  amount: TFxAmount,
  target: TFxCode,
  date: TDateDraft | 'current'
) => number

export const getConverter: TSelector<TFxConverter> = createSelector(
  [getFxRatesGetter],
  getter => {
    return (amount, target, date) =>
      convertFx(amount, target, getter(date).rates)
  }
)
