import { OptionalExceptFor, TRawTransaction } from 'types'
import { v1 as uuidv1 } from 'uuid'

export type TransactionDraft = OptionalExceptFor<
  TRawTransaction,
  | 'user'
  | 'date'
  | 'incomeInstrument'
  | 'incomeAccount'
  | 'outcomeInstrument'
  | 'outcomeAccount'
>

export default function makeTransaction(
  raw: TransactionDraft
): TRawTransaction {
  return {
    id: raw.id || uuidv1(),
    changed: raw.changed || Date.now(),
    created: raw.created || Date.now(),
    user: raw.user,
    deleted: raw.deleted || false,
    hold: raw.hold || false,
    viewed: raw.viewed || false,

    qrCode: raw.qrCode || null,

    income: raw.income || 0,
    incomeInstrument: raw.incomeInstrument,
    incomeAccount: raw.incomeAccount,
    incomeBankID: raw.incomeBankID || null,

    outcome: raw.outcome || 0,
    outcomeInstrument: raw.outcomeInstrument,
    outcomeAccount: raw.outcomeAccount,
    outcomeBankID: raw.outcomeBankID || null,

    opIncome: raw.opIncome || 0,
    opIncomeInstrument: raw.opIncomeInstrument || null,
    opOutcome: raw.opOutcome || 0,
    opOutcomeInstrument: raw.opOutcomeInstrument || null,

    tag: raw.tag || null,
    date: raw.date,
    mcc: raw.mcc || null,
    comment: raw.comment || null,
    payee: raw.payee || null,
    originalPayee: raw.originalPayee || null,
    merchant: raw.merchant || null,
    latitude: raw.latitude || null,
    longitude: raw.longitude || null,
    reminderMarker: raw.reminderMarker || null,
  }
}
