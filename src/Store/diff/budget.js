import { createSlice } from 'redux-starter-kit'
import { removeSynced } from './actions'
import { getRootUser } from 'store/data/users'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'

const { reducer, actions } = createSlice({
  slice: 'diff/budget',
  initialState: {},
  reducers: {
    setBudget: (state, { payload }) => {
      const budget = payload
      const id = `${budget.tag},${budget.date}`
      state[id] = budget
    },
  },
  extraReducers: {
    [removeSynced]: (state, { payload }) => {
      const syncStarted = payload
      Object.keys(state).forEach(id => {
        if (state[id].changed < syncStarted) {
          delete state[id]
        }
      })
    },
  },
})

export default reducer

// ACTIONS
export const { setBudget } = actions

export const setOutcomeBudget = (outcome, month, tagId) => (
  dispatch,
  getState
) => {
  const budgets = getState().data.budget
  const formattedMonth = format(month, 'YYYY-MM-DD', { locale: ru })
  const id = tagId + ',' + formattedMonth
  const userId = getRootUser(getState()).id

  const budget = budgets[id]
    ? budgets[id]
    : createBudget({ user: userId, date: formattedMonth, tag: tagId })
  const changed = { ...budget, outcome, changed: Date.now() / 1000 }

  dispatch(setBudget(changed))
}

function createBudget({
  user,
  changed = Date.now() / 1000,
  date,
  tag,
  income = 0,
  incomeLock = false,
  outcome = 0,
  outcomeLock = false,
}) {
  return {
    user,
    changed,
    date,
    tag,
    income,
    incomeLock,
    outcome,
    outcomeLock,
  }
}

// SELECTOR
export const getTransaction = (state, id) => state.dataToSync.transaction[id]
