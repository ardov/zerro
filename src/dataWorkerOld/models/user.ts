import { TFxCode, TFxIdMap, TInstrumentId } from './instrument'
import { TCountryId } from './country'
import { isoToUnix, TISOTimestamp, TUnixTime, unixToISO } from './common'
import { Modify } from 'types'

export type TUserId = number

export type TZmUser = {
  id: TUserId
  changed: TUnixTime
  currency: TInstrumentId
  parent: TUserId | null
  country: TCountryId
  countryCode: string
  email: string | null
  login: string | null
  monthStartDay: 1
  paidTill: TUnixTime
  subscription: '10yearssubscription' | '1MonthSubscription' | string
}

export type TUser = Modify<
  TZmUser,
  {
    // Converted
    changed: TISOTimestamp
    paidTill: TISOTimestamp
    // Custom fields
    fxCode: TFxCode
  }
>

// Converter
export const convertUser = {
  toClient: (el: TZmUser, fxIdMap: TFxIdMap): TUser => ({
    ...el,
    changed: unixToISO(el.changed),
    paidTill: unixToISO(el.paidTill),
    fxCode: fxIdMap[el.currency],
  }),
  toServer: (el: TUser): TZmUser => {
    const res = {
      ...el,
      changed: isoToUnix(el.changed),
      paidTill: isoToUnix(el.paidTill),
      fxCode: undefined,
    }
    delete res.fxCode
    return res
  },
}
