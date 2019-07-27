import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData, updateDataFunc } from 'store/data/commonActions'
import { getInstrument } from 'store/data/instruments'
import { convertToSyncArray } from 'helpers/converters'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'user',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      updateDataFunc(state, payload, 'user')
    },
  },
})

// REDUCER
export default reducer

// SELECTORS
export const getUsers = state => state.data.user
export const getUsersToSave = createSelector(
  [getUsers],
  users => convertToSyncArray(users)
)

export const getRootUser = state => {
  const users = getUsers(state)
  return Object.values(users).reduce(
    (res, user) => (!user.parent ? user : res),
    {}
  )
}

export const getUserInstrument = state => {
  const instrumentId = getRootUser(state).currency
  return getInstrument(state, instrumentId)
}
