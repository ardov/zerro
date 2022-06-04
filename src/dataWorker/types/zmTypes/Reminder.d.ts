import { InstrumentId, TFxCode } from './Instrument'
import { UserId } from './User'
import { MerchantId } from './Merchant'
import {
  TISODate,
  TISOTimestamp,
  TMilliUnits,
  TUnits,
  TUnixTime,
} from './common'
import { Modify } from '../ts-utils'

export type ReminderId = string

export interface ZmReminder {
  id: ReminderId
  changed: TUnixTime
  user: UserId
  incomeInstrument: InstrumentId
  incomeAccount: string
  income: TUnits
  outcomeInstrument: InstrumentId
  outcomeAccount: string
  outcome: TUnits
  tag: string[] | null
  merchant: MerchantId | null
  payee: string | null
  comment: string | null
  interval: 'day' | 'week' | 'month' | 'year' | null
  step: number | null
  points: number[] | null
  startDate: TISODate
  endDate: TISODate
  notify: boolean
}

export type TReminder = Modify<
  ZmReminder,
  {
    changed: TISOTimestamp
    income: TMilliUnits
    outcome: TMilliUnits
    incomeFxCode: TFxCode
    outcomeFxCode: TFxCode
    // Should we change this to TISOTimestamp?
    // startDate: TISODate
    // endDate: TISODate
  }
>
