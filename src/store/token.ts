import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { Token } from 'types'

const { reducer, actions } = createSlice({
  name: 'token',
  initialState: null as Token,
  reducers: {
    setToken: (_, action: PayloadAction<Token>) => action.payload,
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setToken } = actions

// SELECTORS
export const getToken = (state: RootState) => state.token
export const getLoginState = (state: RootState) => !!getToken(state)
