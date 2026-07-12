import type { TDiff as TNormalizedPatch } from './domain/zenmoney/store'

export { DataEntity } from './domain/patch'
export type {
  TDataStore,
  TDiff as TNormalizedPatch,
} from './domain/zenmoney/store'

export type TCoreContext = {
  now: () => number
  uuid: () => string
}

export type TCompiled<TReceipt> = {
  patch: TNormalizedPatch
  receipt: TReceipt
}
