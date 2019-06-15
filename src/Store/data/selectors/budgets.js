import parseDate from 'date-fns/parse'
import createSelector from 'selectorator'
import { getUsersById } from './users'
import { getTagsById } from './tags'

export const normalize = ({ users, tags }, raw) => ({
  user: users[raw.user],
  changed: raw.changed * 1000,

  date: +parseDate(raw.date),
  tag: raw.tag,

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

export const getBudgetsByMonthAndTag = createSelector(
  [getBudgetsById],
  budgets => {
    const result = {}
    for (const id in budgets) {
      const budget = budgets[id]
      const { date, tag } = budget
      if (!result[date]) {
        result[date] = {}
      }
      result[date][tag] = budget
    }
    return result
  }
)

export const getBudget = (state, id) => getBudgetsById(state)[id]
