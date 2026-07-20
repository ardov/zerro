import type { TDataStore, TNormalizedPatch } from './store'
import { applyPatch } from './applyPatch'

export function replay(base: TDataStore, patches: TNormalizedPatch[]): TDataStore {
  return patches.reduce((state, patch) => applyPatch(state, patch), base)
}
