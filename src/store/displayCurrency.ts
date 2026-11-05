import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { AppThunk, RootState } from '@/store'
import type { TFxCode, TToken } from '@/6-shared/types'
import { track } from '@/6-shared/analytics'
import { safeLocalStorage } from '@/6-shared/api/browserStorage'
import { tokenStorage } from '@/6-shared/api/tokenStorage'
import { fakeToken } from '@/6-shared/api/zenmoney/fetchDiff'

const currencyKey = (token: TToken) =>
  token === fakeToken ? 'demo-display-currency' : 'display-currency'
const savedCurrency = {
  get: (token: TToken) => {
    const raw = safeLocalStorage.getItem(currencyKey(token))
    if (!raw) return null
    try {
      return JSON.parse(raw) as TFxCode
    } catch {
      return null
    }
  },
  set: (token: TToken, currency: TFxCode | null) => {
    const key = currencyKey(token)
    if (currency) safeLocalStorage.setItem(key, JSON.stringify(currency))
    else safeLocalStorage.removeItem(key)
  },
}

const { reducer, actions } = createSlice({
  name: 'displayCurrency',
  initialState: () => savedCurrency.get(tokenStorage.get()),
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

export const loadSavedCurrency = (): AppThunk => (dispatch, getState) => {
  dispatch(setCurrency(savedCurrency.get(getState().token)))
}

export const setSavedCurrency =
  (currency: TFxCode | null): AppThunk =>
  (dispatch, getState) => {
    savedCurrency.set(getState().token, currency)
    dispatch(setCurrency(currency))
    track('setting_changed', {
      setting: 'display_currency',
      value: currency ? 'set' : 'changed',
    })
  }
