import parseDate from 'date-fns/parse'
import createSelector from 'selectorator'
import { getInstrumentsById } from './instruments'
import { getAccountsById } from './accounts'
import { getUsersById } from './users'
import { getTagsById } from './tags'
import { getMerchantsById } from './merchants'
import { groupTransactionsBy } from './Utils/transactions'
import { getFilterConditions, check } from '../../filterConditions'

export const normalize = (
  { instruments, accounts, users, tags, merchants },
  raw
) => ({
  id: raw.id,
  user: users[raw.user],
  date: +parseDate(raw.date),

  changed: raw.changed * 1000,
  created: raw.created * 1000,

  deleted: raw.deleted,
  hold: raw.hold,
  qrCode: raw.qrCode,

  income: raw.income,
  incomeInstrument: instruments[raw.incomeInstrument],
  incomeAccount: accounts[raw.incomeAccount],
  opIncome: raw.opIncome,
  opIncomeInstrument: instruments[raw.opIncomeInstrument],
  incomeBankID: raw.incomeBankID,

  outcome: raw.outcome,
  outcomeInstrument: instruments[raw.outcomeInstrument],
  outcomeAccount: accounts[raw.outcomeAccount],
  opOutcome: raw.opOutcome,
  opOutcomeInstrument: instruments[raw.opOutcomeInstrument],
  outcomeBankID: raw.outcomeBankID,

  tag: mapTags(raw.tag, tags),
  comment: raw.comment,
  payee: raw.payee,
  originalPayee: raw.originalPayee,
  merchant: merchants[raw.merchant],

  latitude: raw.latitude,
  longitude: raw.longitude,
  reminderMarker: raw.reminderMarker,

  //COMPUTED PROPERTIES
  type: getType(raw),
})

export const getTransactionsById = createSelector(
  [
    getInstrumentsById,
    getAccountsById,
    getUsersById,
    getTagsById,
    getMerchantsById,
    'data.transaction',
    'changed.transaction',
  ],
  (instruments, accounts, users, tags, merchants, transactions, changed) => {
    const result = {}
    const merged = { ...transactions, ...changed }
    for (const id in merged) {
      result[id] = normalize(
        { instruments, accounts, users, tags, merchants },
        merged[id]
      )
    }
    return result
  }
)

export const getRawTransactionsById = createSelector(
  ['data.transaction', 'changed.transaction'],
  (transactions, changed) => {
    return { ...transactions, ...changed }
  }
)

export const getRawTransaction = (state, id) =>
  getRawTransactionsById(state)[id]

export const getTransaction = (state, id) => getTransactionsById(state)[id]

export const getTransactionList = createSelector(
  [getTransactionsById],
  transactions => {
    let list = []
    for (let id in transactions) {
      list.push(transactions[id])
    }
    return list.sort(sortBy('DATE'))
  }
)

export const getFilteredTransactionList = createSelector(
  [getTransactionList, getFilterConditions],
  (list, conditions) => list.filter(check(conditions))
)

export const getGrouppedByDay = createSelector(
  [getFilteredTransactionList],
  list => groupTransactionsBy('day', list)
)
export const getGrouppedByWeek = createSelector(
  [getFilteredTransactionList],
  list => groupTransactionsBy('week', list)
)
export const getGrouppedByMonth = createSelector(
  [getFilteredTransactionList],
  list => groupTransactionsBy('month', list)
)

export const getOpenedTransaction = createSelector(
  [getTransactionsById, 'openedTransaction'],
  (transactions, openedId) => transactions[openedId]
)

export const getTransactionList2 = (state, options) => {
  const { ids, conditions, groupBy, sortType, ascending } = options
  const filterConditions =
    conditions || conditions === null ? conditions : getFilterConditions(state)
  const list = ids
    ? ids.map(id => getTransaction(state, id))
    : getTransactionList(state)
  const filtered = list
    .filter(check(filterConditions))
    .sort(sortBy(sortType, ascending))
  return groupBy ? groupTransactionsBy(groupBy, filtered) : filtered
}

// HELPERS

function sortBy(sortType = 'DATE', ascending = false) {
  const sortFuncs = {
    DATE: (tr1, tr2) => {
      const result =
        +tr2.date === +tr1.date
          ? tr2.created - tr1.created
          : tr2.date - tr1.date
      return ascending ? -result : result
    },
    CHANGED: (tr1, tr2) =>
      ascending ? tr1.changed - tr2.changed : tr2.changed - tr1.changed,
  }
  return sortFuncs[sortType]
}

function mapTags(ids, tags) {
  return ids && ids.length ? ids.map(id => tags[id]) : null
}

function getType(tr) {
  return tr.income && tr.outcome ? 'transfer' : tr.income ? 'income' : 'outcome'
}
