import {
  isoToUnix,
  milliunitsToUnits,
  TISODate,
  TISOTimestamp,
  TMilliUnits,
  TUnits,
  TUnixTime,
  unitsToMilliunits,
  unixToISO,
} from './common'
import { Modify } from 'types'
import { TUserId } from './user'
import { TCompanyId } from './company'
import { TFxCode, TFxIdMap, TInstrumentId } from './instrument'
import { TAccountId } from './account'
import { TTagId } from './tag'
import { TMerchantId } from './merchant'
import { TReminderMarkerId } from './reminderMarker'

export type TTransactionId = string

export type TTransactionType =
  | 'income'
  | 'outcome'
  | 'transfer'
  | 'incomeDebt'
  | 'outcomeDebt'

export type TZmTransaction = {
  id: TTransactionId // UUID
  changed: TUnixTime
  created: TUnixTime
  user: TUserId
  deleted: boolean
  hold: boolean | null
  viewed?: boolean
  qrCode: string | null
  incomeBankID: TCompanyId | null
  incomeInstrument: TInstrumentId
  incomeAccount: TAccountId
  income: TUnits
  outcomeBankID: TCompanyId | null
  outcomeInstrument: TInstrumentId
  outcomeAccount: TAccountId
  outcome: TUnits
  tag: TTagId[] | null
  merchant: TMerchantId | null
  payee: string | null
  originalPayee: string | null
  comment: string | null
  date: TISODate
  mcc: number | null
  reminderMarker: TReminderMarkerId | null
  opIncome: TUnits | null
  opIncomeInstrument: TInstrumentId | null
  opOutcome: TUnits | null
  opOutcomeInstrument: TInstrumentId | null
  latitude: number | null
  longitude: number | null
}

export type TTransaction = Modify<
  TZmTransaction,
  {
    // Converted
    changed: TISOTimestamp
    created: TISOTimestamp
    // date: TISOTimestamp,
    income: TMilliUnits
    outcome: TMilliUnits
    opIncome: TMilliUnits | null
    opOutcome: TMilliUnits | null
    // Custom
    incomeFxCode: TFxCode
    outcomeFxCode: TFxCode
    opIncomeFxCode: TFxCode | null
    opOutcomeFxCode: TFxCode | null
    time: TISOTimestamp
    type: TTransactionType
    mainTag: TTagId | null

    // Maybe add these later. Requires 2 cycles of recalculations.
    // incomeBalanceBefore: TMilliUnits
    // outcomeBalanceBefore: TMilliUnits
  }
>

// Converter
export const convertTransaction = {
  toClient: (
    el: TZmTransaction,
    fxIdMap: TFxIdMap,
    debtAccountId: TAccountId
  ): TTransaction => ({
    ...el,
    // Converted
    changed: unixToISO(el.changed),
    created: unixToISO(el.created),
    income: unitsToMilliunits(el.income),
    outcome: unitsToMilliunits(el.outcome),
    opIncome: el.opIncome && unitsToMilliunits(el.opIncome),
    opOutcome: el.opOutcome && unitsToMilliunits(el.opOutcome),
    // Custom
    incomeFxCode: fxIdMap[el.incomeInstrument],
    outcomeFxCode: fxIdMap[el.outcomeInstrument],
    opIncomeFxCode:
      el.opIncomeInstrument === null ? null : fxIdMap[el.opIncomeInstrument],
    opOutcomeFxCode:
      el.opOutcomeInstrument === null ? null : fxIdMap[el.opOutcomeInstrument],
    time: getTransactionTime(el),
    type: getTransactionType(el, debtAccountId),
    mainTag: getTransactionMainTag(el),
  }),
  toServer: (el: TTransaction): TZmTransaction => {
    const res = {
      ...el,
      // Converted
      changed: isoToUnix(el.changed),
      created: isoToUnix(el.created),
      income: milliunitsToUnits(el.income),
      outcome: milliunitsToUnits(el.outcome),
      opIncome: el.opIncome && milliunitsToUnits(el.opIncome),
      opOutcome: el.opOutcome && milliunitsToUnits(el.opOutcome),
      // Custom
      incomeFxCode: undefined,
      outcomeFxCode: undefined,
      opIncomeFxCode: undefined,
      opOutcomeFxCode: undefined,
      time: undefined,
      type: undefined,
      mainTag: undefined,
    }
    delete res.incomeFxCode
    delete res.outcomeFxCode
    delete res.opIncomeFxCode
    delete res.opOutcomeFxCode
    delete res.time
    delete res.type
    delete res.mainTag
    return res
  },
}

// Helpers

function getTransactionType(
  tr: TZmTransaction,
  debtId: TAccountId
): TTransactionType {
  if (debtId && tr.incomeAccount === debtId) return 'outcomeDebt'
  if (debtId && tr.outcomeAccount === debtId) return 'incomeDebt'
  if (tr.income && tr.outcome) return 'transfer'
  if (tr.outcome) return 'outcome'
  return 'income'
}

function getTransactionTime(tr: TZmTransaction): TISOTimestamp {
  const date = new Date(tr.date)
  const creationDate = new Date(tr.created)
  creationDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  return creationDate.toISOString()
}

function getTransactionMainTag(tr: TZmTransaction) {
  if (tr.tag) return tr.tag[0]
  else return null
}
