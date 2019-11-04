import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData, updateDataFunc } from 'store/data/commonActions'
import { convertToSyncArray } from 'helpers/converters'
import { getUserInstrumentId } from '../users'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'instrument',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      updateDataFunc(state, payload, 'instrument')
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

export const getUserInstrument = state =>
  getInstrument(state, getUserInstrumentId(state))

export const getUserCurrencyCode = state =>
  getUserInstrument(state) ? getUserInstrument(state).shortCode : 'RUB'

export const convertCurrency = createSelector(
  [getInstruments, getUserInstrumentId],
  (instruments, userInstrument) => (amount = 0, from, to = userInstrument) =>
    (amount * instruments[from].rate) / instruments[to].rate
)
