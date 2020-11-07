import { createSlice } from '@reduxjs/toolkit'
import { RootState } from 'store'

// INITIAL STATE
const initialState = localStorage.getItem('theme')
  ? localStorage.getItem('theme')
  : new Date().getHours() < 6
  ? 'dark'
  : 'light'

// SLICE
const { reducer, actions } = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggle: state => (state === 'light' ? 'dark' : 'light'),
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { toggle } = actions

// SELECTORS
export const getTheme = (state: RootState) => state.theme
