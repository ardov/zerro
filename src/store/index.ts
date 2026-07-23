import type { UnknownAction, ThunkAction } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { tokenStorage } from '6-shared/api/tokenStorage'

import { replicaPersistenceMiddleware } from './data/replicaPersistence'
import { rootReducer } from './rootReducer'
import type { RootState } from './rootReducer'

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: { token: tokenStorage.get() },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(replicaPersistenceMiddleware),
})

export type AppStore = typeof store
export type { RootState } from './rootReducer'
export type AppDispatch = AppStore['dispatch']
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  undefined,
  UnknownAction
>
export type TSelector<T, Argument = undefined> = (
  state: RootState,
  argument?: Argument
) => T

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

export function useAppCommand<TArgs extends unknown[], TResult>(
  command: (...args: TArgs) => AppThunk<TResult>
) {
  const dispatch = useAppDispatch()
  return useCallback(
    (...args: TArgs) => dispatch(command(...args)),
    [command, dispatch]
  )
}
