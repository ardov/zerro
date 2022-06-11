import { TUserId } from './user'
import { TInstrumentId, TFxCode, TFxIdMap } from './instrument'
import { TCompanyId } from './company'
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

export type TAccountId = string

export type TZmAccount = {
  user: TUserId
  instrument: TInstrumentId
  title: string
  id: TAccountId
  changed: TUnixTime
  role: number | null
  company: TCompanyId | null
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
  TZmAccount,
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

// Converter
export const convertAccount = {
  toClient: (el: TZmAccount, fxIdMap: TFxIdMap): TAccount => ({
    ...el,
    changed: unixToISO(el.changed),
    balance: unitsToMilliunits(el.balance),
    startBalance: unitsToMilliunits(el.startBalance),
    creditLimit: unitsToMilliunits(el.creditLimit),
    inBudget: isInBudget(el),
    fxCode: fxIdMap[el.instrument],
  }),
  toServer: (el: TAccount): TZmAccount => {
    const res = {
      ...el,
      changed: isoToUnix(el.changed),
      balance: milliunitsToUnits(el.balance),
      startBalance: milliunitsToUnits(el.startBalance),
      creditLimit: milliunitsToUnits(el.creditLimit),
      inBudget: undefined,
      fxCode: undefined,
    }
    delete res.inBudget
    delete res.fxCode
    return res
  },
}

// Helpers
function isInBudget(acc: TZmAccount): boolean {
  if (acc.type === 'debt') return false
  if (acc.title.endsWith('📍')) return true
  return acc.inBalance
}
