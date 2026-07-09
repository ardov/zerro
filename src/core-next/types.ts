import type { TDiff as TNormalizedPatch } from './zenmoney/store'

export { DataEntity } from './patch'
export type { TDataStore, TDiff as TNormalizedPatch } from './zenmoney/store'

export type TCoreContext = {
  now: () => number
  uuid: () => string
}

export type TCompiled<TReceipt> = {
  patch: TNormalizedPatch
  receipt: TReceipt
}
