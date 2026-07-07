import type { TAccountId } from '../accounts'
import type { TCompanyId } from '../companies'
import type { TInstrumentId } from '../instruments'
import type { TMerchantId } from '../merchants'
import type { TMsTime, TISODate, TUnixTime, TUnits } from '../primitives'
import type { TReminderMarkerId } from '../reminderMarkers'
import type { TTagId } from '../tags'
import type { TUserId } from '../users'

export type TTransactionId = string

export type TZmTransaction = {
  id: TTransactionId
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

export type TTransaction = Omit<TZmTransaction, 'changed' | 'created'> & {
  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  created: TMsTime
}
