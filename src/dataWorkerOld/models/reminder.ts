import { TInstrumentId, TFxCode, TFxIdMap } from './instrument'
import { TUserId } from './user'
import { TMerchantId } from './merchant'
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

export type TReminderId = string

export interface TZmReminder {
  id: TReminderId
  changed: TUnixTime
  user: TUserId
  incomeInstrument: TInstrumentId
  incomeAccount: string
  income: TUnits
  outcomeInstrument: TInstrumentId
  outcomeAccount: string
  outcome: TUnits
  tag: string[] | null
  merchant: TMerchantId | null
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
  TZmReminder,
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

// Converter
export const convertReminder = {
  toClient: (el: TZmReminder, fxIdMap: TFxIdMap): TReminder => ({
    ...el,
    changed: unixToISO(el.changed),
    income: unitsToMilliunits(el.income),
    outcome: unitsToMilliunits(el.outcome),
    incomeFxCode: fxIdMap[el.incomeInstrument],
    outcomeFxCode: fxIdMap[el.outcomeInstrument],
  }),
  toServer: (el: TReminder): TZmReminder => {
    const res = {
      ...el,
      changed: isoToUnix(el.changed),
      income: milliunitsToUnits(el.income),
      outcome: milliunitsToUnits(el.outcome),
      incomeFxCode: undefined,
      outcomeFxCode: undefined,
    }
    delete res.incomeFxCode
    delete res.outcomeFxCode
    return res
  },
}
