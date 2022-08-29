import { TMilliUnits, TUnits } from '@shared/types'

export type TZmAdapter<ZmType, ClientType> = {
  toClient: (el: ZmType) => ClientType
  toServer: (el: ClientType) => ZmType
}

// Units <-> MilliUnits

export function unitsToMilliunits(units: TUnits): TMilliUnits {
  return Math.round(units * 10000)
}
export function milliunitsToUnits(milliunits: TMilliUnits): TUnits {
  return milliunits / 10000
}
