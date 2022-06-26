import {
  TDateDraft,
  TISODate,
  TISOMonth,
  TISOTimestamp,
  TMilliUnits,
  TMsTime,
  TUnits,
  TUnixTime,
} from 'shared/types'

export type TZmAdapter<ZmType, ClientType> = {
  toClient: (el: ZmType) => ClientType
  toServer: (el: ClientType) => ZmType
}

// Dates

export function zmDateToMs(date: TUnixTime | TISODate): TMsTime {
  return typeof date === 'string' ? +new Date(date) : date * 1000
}
export function msToUnix(date: TMsTime): TUnixTime {
  return date / 1000
}
export function toISODate(date: TDateDraft): TISODate {
  return new Date(date).toISOString().slice(0, 10) as TISODate
}
export function toISOMonth(date: TDateDraft): TISOMonth {
  return new Date(date).toISOString().slice(0, 7) as TISOMonth
}
export function unixToISO(unix: TUnixTime): TISOTimestamp {
  return new Date(unix * 1000).toISOString()
}
export function isoToUnix(iso: TISOTimestamp): TUnixTime {
  return new Date(iso).getTime() / 1000
}

// Units <-> MilliUnits

export function unitsToMilliunits(units: TUnits): TMilliUnits {
  return Math.round(units * 10000)
}
export function milliunitsToUnits(milliunits: TMilliUnits): TUnits {
  return milliunits / 10000
}
