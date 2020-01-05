import { createSelector } from 'redux-starter-kit'
import populate from './populate'
import { getInstruments } from 'store/serverData'

// SELECTORS
export const getAccounts = state => state.serverData.account

export const getAccount = (state, id) => getAccounts(state)[id]

// Used only for CSV
// TODO: remove
export const getPopulatedAccounts = createSelector(
  [getInstruments, getAccounts],
  (instruments, accounts) => {
    const result = {}
    for (const id in accounts) {
      result[id] = populate({ instruments }, accounts[id])
    }
    return result
  }
)

export const getAccountList = createSelector([getAccounts], accounts =>
  Object.values(accounts).sort((a, b) => b.balance - a.balance)
)

export const getCredits = createSelector([getAccountList], list =>
  list.filter(a => !a.archive && a.balance < 0)
)

export const getAccountsInBudget = createSelector([getAccountList], accounts =>
  accounts.filter(
    a => a.title.endsWith('📍') || (a.inBalance && a.type !== 'debt')
  )
)

export const getSavingAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(
    a =>
      !a.title.endsWith('📍') && !a.archive && !a.inBalance && a.type !== 'debt'
  )
)
