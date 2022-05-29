import { UserId } from './User'
import { CompanyId } from './Company'
import { InstrumentId } from './Instrument'
import { AccountId } from './Account'
import { TagId } from './Tag'
import { MerchantId } from './Merchant'
import { ReminderMarkerId } from './ReminderMarker'
import {
  TISODate,
  TISOTimestamp,
  TMilliUnits,
  TUnits,
  TUnixTime,
} from './common'
import { Modify } from '../ts-utils'

export type TransactionId = string

export type TransactionType =
  | 'income'
  | 'outcome'
  | 'transfer'
  | 'incomeDebt'
  | 'outcomeDebt'

export interface ZmTransaction {
  id: TransactionId // UUID
  changed: TUnixTime
  created: TUnixTime
  user: UserId
  deleted: boolean
  hold: boolean | null
  viewed?: boolean
  qrCode: string | null
  incomeBankID: CompanyId | null
  incomeInstrument: InstrumentId
  incomeAccount: AccountId
  income: TUnits
  outcomeBankID: CompanyId | null
  outcomeInstrument: InstrumentId
  outcomeAccount: AccountId
  outcome: TUnits
  tag: TagId[] | null
  merchant: MerchantId | null
  payee: string | null
  originalPayee: string | null
  comment: string | null
  date: TISODate
  mcc: number | null
  reminderMarker: ReminderMarkerId | null
  opIncome: TUnits | null
  opIncomeInstrument: InstrumentId | null
  opOutcome: TUnits | null
  opOutcomeInstrument: InstrumentId | null
  latitude: number | null
  longitude: number | null
}

export type TTransaction = Modify<
  ZmTransaction,
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
    type: TransactionType
    mainTag: TagId | null

    // Maybe add these later. Requires 2 cycles of recalculations.
    // incomeBalanceBefore: TMilliUnits
    // outcomeBalanceBefore: TMilliUnits
  }
>
