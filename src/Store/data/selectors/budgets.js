import parseDate from 'date-fns/parse'
import createSelector from 'selectorator'
import { getUsersById } from './users'
import { getTagsById } from './tags'

export const normalize = ({ users, tags }, raw) => ({
  id: raw.id,
  user: users[raw.user],
  changed: raw.changed * 1000,

  date: +parseDate(raw.date),
  tag: tags[raw.tag],

  income: raw.income,
  incomeLock: raw.incomeLock,
  outcome: raw.outcome,
  outcomeLock: raw.outcomeLock
})

export const getBudgetsById = createSelector(
  [getUsersById, getTagsById, 'data.budget'],
  (users, tags, budgets) => {
    const result = {}
    for (const id in budgets) {
      result[id] = normalize({ users, tags }, budgets[id])
    }
    return result
  }
)

export const getBudget = (state, id) => getBudgetsById(state)[id]
