import createSelector from 'selectorator'
import { getUsersById } from './users'

export const normalize = ({ users }, raw) => ({
  id: raw.id,
  user: users[raw.user],
  changed: raw.changed * 1000,
  icon: raw.icon,
  budgetIncome: raw.budgetIncome,
  budgetOutcome: raw.budgetOutcome,
  required: raw.required,
  color: raw.color,
  picture: raw.picture,
  showIncome: raw.showIncome,
  showOutcome: raw.showOutcome,
  parent: raw.parent,

  fullTitle: raw.title,
  title: raw.title, //TODO
  symbol: '😆' //TODO
})

export const getTagsById = createSelector(
  [getUsersById, 'data.tag'],
  (users, tags) => {
    const result = {}
    for (const id in tags) {
      result[id] = normalize({ users }, tags[id])
    }
    return result
  }
)

export const getTag = (state, id) => getTagsById(state)[id]
