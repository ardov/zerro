import {
  configureStore,
  UnknownAction,
  ThunkAction,
  ThunkDispatch,
} from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { tokenStorage } from '6-shared/api/tokenStorage'

import data from './data'
import token from './token'
import isPending from './isPending'
import lastSync from './lastSync'
import displayCurrency from './displayCurrency'

export const store = configureStore({
  reducer: {
    data,
    isPending,
    lastSync,
    token,
    displayCurrency,
  },
  preloadedState: { token: tokenStorage.get() },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  UnknownAction
>
export type TSelector<T> = (state: RootState) => T

// App hooks
export type AppDispatch = ThunkDispatch<RootState, any, UnknownAction> // typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
