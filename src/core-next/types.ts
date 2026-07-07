import type { TDiff as TNormalizedPatch } from '6-shared/types'

export type { TDataStore, TDiff as TNormalizedPatch } from '6-shared/types'

export type TCoreContext = {
  now: () => number
  uuid: () => string
}

export type TCompiled<TReceipt> = {
  patch: TNormalizedPatch
  receipt: TReceipt
}
