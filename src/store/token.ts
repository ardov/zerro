import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { TToken } from 'types'

const { reducer, actions } = createSlice({
  name: 'token',
  initialState: null as TToken,
  reducers: {
    setToken: (_, action: PayloadAction<TToken>) => action.payload,
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setToken } = actions

// SELECTORS
export const getToken = (state: RootState) => state.token
export const getLoginState = (state: RootState) => !!getToken(state)
