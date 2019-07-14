import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData } from 'store/data/commonActions'
import { convertToSyncArray } from 'Utils/converters'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'companies',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      if (payload.company) {
        payload.company.forEach(item => (state[item.id] = item))
      }
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getCompanies = state => state.data.company
export const getCompaniesToSave = createSelector(
  [getCompanies],
  companies => convertToSyncArray(companies)
)
