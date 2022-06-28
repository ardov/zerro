import { TInstrumentId } from 'models/instrument'
import { TMerchantId } from 'models/merchant'
import { TUserId } from 'models/user'
import { Modify, TISODate, TMsTime, TUnits, TUnixTime } from 'shared/types'

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

export type TReminder = Modify<TZmReminder, { changed: TMsTime }>
