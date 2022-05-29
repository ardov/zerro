import { UserId } from './User'
import { InstrumentId, TFxCode } from './Instrument'
import { CompanyId } from './Company'
import { TISODate, TMilliUnits, TUnits, TUnixTime } from './common'
import { Modify } from '../ts-utils'

export type AccountId = string

export type ZmAccount = {
  user: UserId
  instrument: InstrumentId
  title: string
  id: AccountId
  changed: TUnixTime
  role: number | null
  company: CompanyId | null
  type: 'cash' | 'ccard' | 'checking' | 'loan' | 'deposit' | 'emoney' | 'debt'
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
  ZmAccount,
  {
    // Converted
    changed: TISOTimestamp
    // startDate: TISOTimestamp
    balance: TMilliUnits
    startBalance: TMilliUnits
    creditLimit: TMilliUnits
    // Custom fields
    inBudget: boolean
    fxCode: TFxCode
  }
>
