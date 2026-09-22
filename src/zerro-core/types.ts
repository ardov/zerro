import type { TEntityOperation } from './internal/domain/zenmoney/operations'
import type { TZerroOperation } from './internal/domain/zerro/operations/types'

export type {
  TDataEntityKey,
  TDataStore,
  TNormalizedPatch,
  TIntentPatch,
} from './internal/domain/zenmoney/model/store'

export type TOperation = TEntityOperation | TZerroOperation

export type TCoreContext = {
  now: () => number
  uuid: () => string
}

/** The single result shape consumed by command execution. */
export type TCompiled<TReceipt = undefined> = {
  operations: TOperation[]
} & (undefined extends TReceipt
  ? { receipt?: TReceipt }
  : { receipt: TReceipt })
