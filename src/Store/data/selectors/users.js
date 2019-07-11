import createSelector from 'selectorator'
import { getInstruments } from 'store/data/instrument'
import { getCountriesById } from './countries'

export const normalize = (instruments, countries, raw) => ({
  id: raw.id,
  parent: raw.parent,
  login: raw.login,

  country: countries[raw.country],
  countryCode: raw.countryCode,
  currency: instruments[raw.currency],

  paidTill: raw.paidTill * 1000,
  subscription: raw.subscription,

  changed: raw.changed * 1000,
})

export const getUsersById = createSelector(
  [getInstruments, getCountriesById, 'data.user'],
  (instruments, countries, users) => {
    const result = {}
    for (const id in users) {
      result[id] = normalize(instruments, countries, users[id])
    }
    return result
  }
)

export const getUser = (state, id) => getUsersById(state)[id]

export const getRootUser = state => {
  const users = getUsersById(state)
  for (const id in users) {
    if (!users[id].parent) return users[id]
  }
}
