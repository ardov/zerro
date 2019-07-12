import { createSlice } from 'redux-starter-kit'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'countries',
  initialState,
  reducers: {},
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
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
