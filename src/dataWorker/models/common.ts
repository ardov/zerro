// Types

export type TUnixTime = number
export type TISODate = string // 2000-01-01
export type TISOTimestamp = string // 2000-01-01T00:00:00.000Z

export type TUnits = number
export type TMilliUnits = number

// Unix <-> ISO

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
