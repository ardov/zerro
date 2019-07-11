import { createSlice, createSelector } from 'redux-starter-kit'
import { populate } from './populate'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'instrument',
  initialState,
  reducers: {},
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getInstruments = createSelector(
  ['data.instrument'],
  instruments =>
    Object.keys(instruments).reduce((obj, id) => {
      obj[id] = populate(instruments[id])
      return obj
    }, {})
)

export const getInstrument = (state, id) => getInstruments(state)[id]
