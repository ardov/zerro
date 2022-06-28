import { TCompanyId } from 'models/company'
import { TInstrumentId } from 'models/instrument'
import { TUserId } from 'models/user'
import { Modify, TISODate, TMsTime, TUnits, TUnixTime } from 'shared/types'

export type TAccountId = string

export enum accountType {
  cash = 'cash',
  ccard = 'ccard',
  checking = 'checking',
  loan = 'loan',
  deposit = 'deposit',
  emoney = 'emoney',
  debt = 'debt',
}

export type TZmAccount = {
  id: TAccountId
  changed: TUnixTime
  user: TUserId
  instrument: TInstrumentId
  title: string
  role: number | null
  company: TCompanyId | null
  type: accountType
  syncID: string[] | null
  balance: TUnits
  // Для deposit и loan поле startBalance имеет смысл начального взноса/тела кредита
  startBalance: TUnits
  creditLimit: TUnits
  inBalance: boolean
  savings: boolean
  enableCorrection: boolean
  enableSMS: boolean
  archive: boolean
  private: boolean
  // Для счетов с типом отличных от 'loan' и 'deposit' в  этих полях можно ставить null
  capitalization: boolean | null
  percent: number | null
  startDate: TISODate | null
  endDateOffset: number | null
  endDateOffsetInterval: 'day' | 'week' | 'month' | 'year' | null
  payoffStep: number | null
  payoffInterval: 'month' | 'year' | null
}

export type TAccount = Modify<
  TZmAccount,
  {
    changed: TMsTime
    // balance: TMilliUnits
    // startBalance: TMilliUnits
    // creditLimit: TMilliUnits
  }
>

export type TAccountPopulated = TAccount & {
  convertedBalance: number
  convertedStartBalance: number
  inBudget: boolean
}
