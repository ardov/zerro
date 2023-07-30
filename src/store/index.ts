import { configureStore, AnyAction } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { zenmoney } from '6-shared/api/zenmoney'

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
  preloadedState: { token: zenmoney.getLocalToken() },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>
export type TSelector<T> = (state: RootState) => T

// App hooks
export type AppDispatch = ThunkDispatch<RootState, any, AnyAction> // typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
