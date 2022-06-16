import { TUserId } from './user'
import { TInstrumentId, TFxCode, TFxIdMap } from './instrument'
import { TAccountId } from './account'
import { TTagId } from './tag'
import { TMerchantId } from './merchant'
import { TReminderId } from './reminder'
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

export type TReminderMarkerId = string

export type TZmReminderMarker = {
  id: TReminderMarkerId // UUID
  changed: TUnixTime
  user: TUserId
  incomeInstrument: TInstrumentId
  incomeAccount: TAccountId
  income: TUnits
  outcomeInstrument: TInstrumentId
  outcomeAccount: TAccountId
  outcome: TUnits
  tag: TTagId[] | null
  merchant: TMerchantId | null
  payee: string | null
  comment: string | null
  date: TISODate
  reminder: TReminderId
  state: 'planned' | 'processed' | 'deleted'
  notify: boolean
}

export type TReminderMarker = Modify<
  TZmReminderMarker,
  {
    changed: TISOTimestamp
    income: TMilliUnits
    outcome: TMilliUnits
    // Custom
    incomeFxCode: TFxCode
    outcomeFxCode: TFxCode
  }
>

// Converter
export const convertReminderMarker = {
  toClient: (el: TZmReminderMarker, fxIdMap: TFxIdMap): TReminderMarker => ({
    ...el,
    changed: unixToISO(el.changed),
    income: unitsToMilliunits(el.income),
    outcome: unitsToMilliunits(el.outcome),
    incomeFxCode: fxIdMap[el.incomeInstrument],
    outcomeFxCode: fxIdMap[el.outcomeInstrument],
  }),
  toServer: (el: TReminderMarker): TZmReminderMarker => {
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
