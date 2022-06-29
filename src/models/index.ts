import { configureStore, AnyAction } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { zenmoney } from 'shared/api/zenmoney'

import data from './data'
import token from './token'
import isPending from './isPending'
import lastSync from './lastSync'

export const store = configureStore({
  reducer: {
    data,
    isPending,
    lastSync,
    token,
  },
  preloadedState: { token: zenmoney.getLocalToken() },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppGetState = typeof store.getState
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>
export type TSelector<T> = (state: RootState) => T

// App hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
