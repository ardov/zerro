import parseDate from 'date-fns/parse'
import createSelector from 'selectorator'

export const getNormalizedTransactions = createSelector(
  ['data', 'fakeTransactions'],
  (data, fakes) => {
    const normalized = {}
    for (const id in data.transaction) {
      const rawTransaction = fakes[id] ? fakes[id] : data.transaction[id]
      normalized[id] = populateTransaction(rawTransaction, data)
    }
    return normalized
  }
)

const getId = (state, id) => id

const getTransaction = createSelector(
  [getId, getNormalizedTransactions, 'openedTransaction'],
  (id, transactions, openedId) => {
    const res = transactions[id]
    res.isSelected = id === openedId
    return res
  }
)

function populateTransaction(raw, data, openedTransaction) {
  return {
    id: raw.id,
    user: raw.user, // get object

    date: +parseDate(raw.date),
    changed: raw.changed * 1000,
    created: raw.created * 1000,

    deleted: raw.deleted,
    hold: raw.hold,
    qrCode: raw.qrCode,

    income: raw.income,
    incomeInstrument:
      raw.incomeInstrument && data.instrument[raw.incomeInstrument],
    incomeAccount: raw.incomeAccount && data.account[raw.incomeAccount],
    opIncome: raw.opIncome,
    opIncomeInstrument: raw.opIncomeInstrument,

    outcome: raw.outcome,
    outcomeInstrument:
      raw.outcomeInstrument && data.instrument[raw.outcomeInstrument],
    outcomeAccount: raw.outcomeAccount && data.account[raw.outcomeAccount],
    opOutcome: raw.opOutcome,
    opOutcomeInstrument: raw.opOutcomeInstrument,

    tag: raw.tag && raw.tag.map(id => data.tag[id]),
    comment: raw.comment,
    payee: raw.payee,
    originalPayee: raw.originalPayee,
    merchant: raw.merchant, // get object

    latitude: raw.latitude,
    longitude: raw.longitude,
    incomeBankID: raw.incomeBankID,
    outcomeBankID: raw.outcomeBankID,
    reminderMarker: raw.reminderMarker,

    //COMPUTED PROPERTIES
    type: getType(raw),
    isSelected: raw.id === openedTransaction
  }

  // function getIcon(params) {}
}

export const makeGetTransaction = () => getTransaction

function getType(tr) {
  return tr.income && tr.outcome ? 'transfer' : tr.income ? 'income' : 'outcome'
}
