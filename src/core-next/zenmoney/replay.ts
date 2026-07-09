import type { TDataStore, TDiff } from './store'
import { applyPatch } from './applyPatch'

export function replay(base: TDataStore, patches: TDiff[]): TDataStore {
  return patches.reduce((state, patch) => applyPatch(state, patch), base)
}
