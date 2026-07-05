import type { TDataStore, TDiff } from '6-shared/types'
import { applyPatch } from './applyPatch'

export function replay(base: TDataStore, patches: TDiff[]): TDataStore {
  return patches.reduce((state, patch) => applyPatch(state, patch), base)
}
