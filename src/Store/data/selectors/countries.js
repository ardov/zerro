import createSelector from 'selectorator'
import { getInstrumentsById } from './instruments'

export const normalize = (instruments, raw) => ({
  id: raw.id,
  title: raw.title,
  currency: instruments[raw.currency],
  domain: raw.domain
})

export const getCountriesById = createSelector(
  [getInstrumentsById, 'data.country'],
  (instruments, countries) => {
    const result = {}
    for (const id in countries) {
      result[id] = normalize(instruments, countries[id])
    }
    return result
  }
)

export const getCountry = (state, id) => getCountriesById(state)[id]
