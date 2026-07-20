import type { TIntentPatch } from './domain/zenmoney/store'

export { DataEntity } from './domain/patch'
export type {
  TDataStore,
  TDiff as TNormalizedPatch,
  TIntentPatch,
} from './domain/zenmoney/store'

export type TCoreContext = {
  now: () => number
  uuid: () => string
}

export type TCompiled<TReceipt> = {
  patch: TIntentPatch
  receipt: TReceipt
}

export function isCompiled<TReceipt>(
  value: TIntentPatch | TCompiled<TReceipt>
): value is TCompiled<TReceipt> {
  return 'patch' in value && 'receipt' in value
}
