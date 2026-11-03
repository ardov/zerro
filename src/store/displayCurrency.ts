import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { AppThunk, RootState } from '@/store'
import type { TFxCode } from '@/6-shared/types'
import { track } from '@/6-shared/analytics'
import { safeLocalStorage } from '@/6-shared/api/browserStorage'

const KEY = 'display-currency'
const savedCurrency = {
  get: () => {
    const raw = safeLocalStorage.getItem(KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as TFxCode
    } catch {
      return null
    }
  },
  set: (currency: TFxCode | null) => {
    if (currency) safeLocalStorage.setItem(KEY, JSON.stringify(currency))
    else safeLocalStorage.removeItem(KEY)
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
  dispatch => {
    savedCurrency.set(currency)
    dispatch(setCurrency(currency))
    track('setting_changed', {
      setting: 'display_currency',
      value: currency ? 'set' : 'changed',
    })
  }
