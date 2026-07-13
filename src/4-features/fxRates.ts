import type { AppThunk } from 'store'
import type { TISODate, TISOMonth } from '6-shared/types'
import { firstPossibleDate, requestRates } from '6-shared/api/fxRates'
import { toISOMonth } from '6-shared/helpers/date'
import { fxRates as coreFxRates } from 'zerro-core/redux'

const getRequestDate = (month: TISOMonth) => (month + '-28') as TISODate

export const canFetchFxRates = (month: TISOMonth) => {
  const isPastMonth = month < toISOMonth(new Date())
  return isPastMonth && getRequestDate(month) >= firstPossibleDate
}

export const loadFxRates =
  (month: TISOMonth): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const isPastMonth = month < toISOMonth(new Date())
    if (!isPastMonth) {
      dispatch(
        coreFxRates.edit(month, coreFxRates.selectCurrent(getState()).rates)
      )
      return
    }

    const date = getRequestDate(month)
    const rates = await requestRates(
      date < firstPossibleDate ? firstPossibleDate : date
    )
    dispatch(coreFxRates.edit(month, rates))
  }
