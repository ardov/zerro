import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData } from 'store/data/commonActions'
import { convertToSyncArray } from 'Utils/converters'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'instruments',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      if (payload.instrument) {
        payload.instrument.forEach(item => (state[item.id] = item))
      }
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getInstruments = state => state.data.instrument
export const getInstrument = (state, id) => getInstruments(state)[id]

export const getInstrumentsToSave = createSelector(
  [getInstruments],
  instruments => convertToSyncArray(instruments)
)
