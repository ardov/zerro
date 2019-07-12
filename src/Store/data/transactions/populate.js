import parseDate from 'date-fns/parse'
import { mapTags, getType } from './helpers'
export const populate = (
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
