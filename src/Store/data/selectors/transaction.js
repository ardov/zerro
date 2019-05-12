import parseDate from 'date-fns/parse'
import createSelector from 'selectorator'
import { getInstrumentsById } from './instruments'
import { getAccountsById } from './accounts'
import { getUsersById } from './users'
import { getTagsById } from './tags'
import { getMerchantsById } from './merchants'
import { getOpenedId } from '../../openedTransaction'

export const normalize = (
  { instruments, accounts, users, tags, merchants, openedId },
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

  outcome: raw.outcome,
  outcomeInstrument: instruments[raw.outcomeInstrument],
  outcomeAccount: accounts[raw.outcomeAccount],
  opOutcome: raw.opOutcome,
  opOutcomeInstrument: instruments[raw.opOutcomeInstrument],

  tag: mapTags(raw.tag, tags),
  comment: raw.comment,
  payee: raw.payee,
  originalPayee: raw.originalPayee,
  merchant: merchants[raw.merchant],

  latitude: raw.latitude,
  longitude: raw.longitude,
  incomeBankID: raw.incomeBankID,
  outcomeBankID: raw.outcomeBankID,
  reminderMarker: raw.reminderMarker,

  //COMPUTED PROPERTIES
  type: getType(raw),
  isSelected: raw.id === openedId
})

export const getTransactionsById = createSelector(
  [
    getInstrumentsById,
    getAccountsById,
    getUsersById,
    getTagsById,
    getMerchantsById,
    getOpenedId,
    'data.transaction'
  ],
  (instruments, accounts, users, tags, merchants, openedId, transactions) => {
    const result = {}
    for (const id in transactions) {
      result[id] = normalize(
        { instruments, accounts, users, tags, merchants, openedId },
        transactions[id]
      )
    }
    return result
  }
)

export const getTransaction = (state, id) => getTransactionsById(state)[id]

// HELPERS

function mapTags(ids, tags) {
  return ids ? tags.map(id => tags[id]) : null
}

function getType(tr) {
  return tr.income && tr.outcome ? 'transfer' : tr.income ? 'income' : 'outcome'
}
