import { getRootUser } from 'store/data/users'
import slice from './slice'
import selectors from './selectors'
const { setBudget } = slice.actions

export const setOutcomeBudget = (outcome, month, tag) => (
  dispatch,
  getState
) => {
  const state = getState()
  const created = selectors.getBudget(state, tag, month)
  const user = getRootUser(state).id
  const budget = created || createBudget({ user, date: +month, tag })
  const changed = { ...budget, outcome, changed: Date.now() }
  dispatch(setBudget(changed))
}

function createBudget(b) {
  return {
    // required
    user: b.user,
    date: b.date,
    tag: b.tag,

    // optional
    changed: b.changed || Date.now(),
    income: b.income || 0,
    incomeLock: b.incomeLock || false,
    outcome: b.outcome || 0,
    outcomeLock: b.outcomeLock || false,
  }
}

export default { setOutcomeBudget }
