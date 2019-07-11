import { createSlice, createSelector } from 'redux-starter-kit'
import populate from './populate'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'user',
  initialState,
  reducers: {},
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getUsers = createSelector(
  ['data.instrument', 'data.country', 'data.user'],
  (instruments, countries, users) => {
    const result = {}
    for (const id in users) {
      result[id] = populate(instruments, countries, users[id])
    }
    return result
  }
)

export const getUser = (state, id) => getUsers(state)[id]

export const getRootUser = state => {
  const users = getUsers(state)
  for (const id in users) {
    if (!users[id].parent) return users[id]
  }
}
