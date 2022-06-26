import {
  TDateDraft,
  TISODate,
  TISOMonth,
  TMsTime,
  TUnixTime,
} from 'shared/types'

export function unixToMs(seconds: TUnixTime): TMsTime {
  return seconds * 1000
}
export function msToUnix(date: TMsTime): TUnixTime {
  return Math.round(date / 1000)
}

export function toISODate(date: TDateDraft): TISODate {
  return new Date(date).toISOString().slice(0, 10) as TISODate
}

export function toISOMonth(date: TDateDraft): TISOMonth {
  return new Date(date).toISOString().slice(0, 7) as TISOMonth
}

export function monthEnd(d: TDateDraft) {
  const date = new Date(d)
  const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return new Date(+nextMonthStart - 1)
}

export function monthStart(d: TDateDraft) {
  const date = new Date(d)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
