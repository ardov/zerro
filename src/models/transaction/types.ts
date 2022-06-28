import { TAccountId } from 'models/account'
import { TCompanyId } from 'models/company'
import { TInstrumentId } from 'models/instrument'
import { TMerchantId } from 'models/merchant'
import { TReminderMarkerId } from 'models/reminderMarker'
import { TTagId } from 'models/tag'
import { TUserId } from 'models/user'
import {
  Modify,
  TISODate,
  TMilliUnits,
  TMsTime,
  TUnits,
  TUnixTime,
} from 'shared/types'

export type TTransactionId = string

export enum TrType {
  income = 'income',
  outcome = 'outcome',
  transfer = 'transfer',
  incomeDebt = 'incomeDebt',
  outcomeDebt = 'outcomeDebt',
}

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

export type TTransaction = Modify<
  TZmTransaction,
  {
    changed: TMsTime
    created: TMsTime
    income: TMilliUnits
    outcome: TMilliUnits
    opIncome: TMilliUnits | null
    opOutcome: TMilliUnits | null
    //   time: TMsTime
    //   type: TrType
    //   mainTag: TTagId | null
    //   incomeBalanceBefore: TMilliUnits
    //   outcomeBalanceBefore: TMilliUnits
  }
>
