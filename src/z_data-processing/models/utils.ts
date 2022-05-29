import { TISOTimestamp, TMilliUnits, TUnits, TUnixTime } from '../types'

export function unixToISO(unix: TUnixTime): TISOTimestamp {
  return new Date(unix * 1000).toISOString()
}
export function isoToUnix(iso: TISOTimestamp): TUnixTime {
  return new Date(iso).getTime() / 1000
}

export function unitsToMilliunits(units: TUnits): TMilliUnits {
  return Math.round(units * 10000)
}
export function milliunitsToUnits(milliunits: TMilliUnits): TUnits {
  return milliunits / 10000
}

interface TWithId {
  id: string
}
export function reorganizeById<T extends TWithId>(
  arr: T[]
): { [id: string]: T } {
  const res: { [id: string]: T } = {}
  return arr.reduce((acc, curr) => {
    acc[curr.id] = curr
    return acc
  }, res)
}

export function convertEach<In, Out>(
  obj: { [key: string]: In },
  converter: (val: In) => Out
): { [key: string]: Out } {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [key, converter(val)])
  )
}
