import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData, updateDataFunc } from 'store/data/commonActions'
import { convertToSyncArray } from 'Utils/converters'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'country',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      updateDataFunc(state, payload, 'country')
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getCountries = state => state.data.country
export const getCountriesToSave = createSelector(
  [getCountries],
  countries => convertToSyncArray(countries)
)
// import createSelector from 'selectorator'
// import { getInstruments } from 'store/data/instrument'

// export const normalize = (instruments, raw) => ({
//   id: raw.id,
//   title: raw.title,
//   currency: instruments[raw.currency],
//   domain: raw.domain,
// })

// export const getCountriesById = createSelector(
//   [getInstruments, 'data.country'],
//   (instruments, countries) => {
//     const result = {}
//     for (const id in countries) {
//       result[id] = normalize(instruments, countries[id])
//     }
//     return result
//   }
// )

// export const getCountry = (state, id) => getCountriesById(state)[id]
