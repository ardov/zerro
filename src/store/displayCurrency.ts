import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppThunk, RootState } from '@store'
import { TFxCode } from '@shared/types'
import { sendEvent } from '@shared/helpers/tracking'

const KEY = 'display-currency'
const savedCurrency = {
  get: () => {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as TFxCode
    } catch (error) {
      return null
    }
  },
  set: (currency: TFxCode | null) => {
    if (currency) localStorage.setItem(KEY, JSON.stringify(currency))
    else localStorage.removeItem(KEY)
  },
}

const initialState = savedCurrency.get()

const { reducer, actions } = createSlice({
  name: 'displayCurrency',
  initialState,
  reducers: {
    setCurrency: (_, action: PayloadAction<TFxCode | null>) => action.payload,
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setCurrency } = actions

// SELECTORS
export const getSavedCurrency = (state: RootState) => state.displayCurrency

export const setSavedCurrency =
  (currency: TFxCode | null): AppThunk =>
  (dispatch, getState) => {
    savedCurrency.set(currency)
    dispatch(setCurrency(currency))
    sendEvent('DisplayCurrency: set')
  }
