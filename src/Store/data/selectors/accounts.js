import createSelector from 'selectorator'
import { getInstruments } from 'store/data/instrument'
import { getUsers } from 'store/data/user'

export const normalize = ({ instruments, users }, raw) => ({
  id: raw.id,
  user: users[raw.user],
  instrument: instruments[raw.instrument],
  type: raw.type,
  role: raw.role,
  private: raw.private,
  savings: raw.savings,
  title: raw.title,
  inBalance: raw.inBalance,
  creditLimit: raw.creditLimit,
  startBalance: raw.startBalance,
  balance: raw.balance,
  // "company": 4902,
  archive: raw.archive,
  enableCorrection: raw.enableCorrection,
  // startDate: null,
  // capitalization: null,
  // percent: null,
  changed: raw.changed * 1000,
  // syncID: ['3314', '8603', '9622'],
  // enableSMS: false,
  // endDateOffset: null,
  // endDateOffsetInterval: null,
  // payoffStep: null,
  // payoffInterval: null
})

export const getAccountsById = createSelector(
  [getInstruments, getUsers, 'data.account'],
  (instruments, users, accounts) => {
    const result = {}
    for (const id in accounts) {
      result[id] = normalize({ instruments, users }, accounts[id])
    }
    return result
  }
)

export const getAccount = (state, id) => getAccountsById(state)[id]

export const getInBalance = createSelector(
  [getAccountsById],
  accounts =>
    Object.keys(accounts)
      .map(id => accounts[id])
      .filter(acc => !acc.archive)
      .filter(acc => acc.inBalance)
      .sort((a, b) => b.balance - a.balance)
)

export const getOutOfBalance = createSelector(
  [getAccountsById],
  accounts =>
    Object.keys(accounts)
      .map(id => accounts[id])
      .filter(acc => !acc.archive)
      .filter(acc => !acc.inBalance)
      .sort((a, b) => b.balance - a.balance)
)
