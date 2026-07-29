import { keys } from '../../foundation/keys'
import type { TDataStore, TNormalizedPatch, TIntentPatch } from './store'

/** Applies either a canonical diff or sparse local intent without deriving effects. */
export function applyPatch(
  base: TDataStore,
  patch: TNormalizedPatch | TIntentPatch
): TDataStore {
  // Clone only the entity maps the patch touches; keep every other map's
  // reference from base. Downstream memoized selectors depend on unrelated
  // maps staying reference-stable across a write (architecture invariant 5), so
  // cloning all maps here would invalidate every calculation on any change.
  const next: TDataStore = { ...base }
  touchedEntityKeys(patch).forEach(key => {
    // @ts-expect-error Dynamic ZenMoney entity access.
    next[key] = { ...base[key] }
  })
  applyPatchMutable(next, patch)
  return next
}

function touchedEntityKeys(
  patch: TNormalizedPatch | TIntentPatch
): Set<string> {
  const touched = new Set<string>()
  patch.deletion?.forEach(obj => touched.add(obj.object))
  keys(patch).forEach(key => {
    if (key === 'deletion' || !patch[key]) return
    const rawKey: string = key
    if (rawKey === 'serverTimestamp') return
    touched.add(key)
  })
  return touched
}

export function applyPatchMutable(
  store: TDataStore,
  patch: TNormalizedPatch | TIntentPatch
): void {
  if ('serverTimestamp' in patch && patch.serverTimestamp) {
    store.serverTimestamp = patch.serverTimestamp
  }

  patch.deletion?.forEach(obj => {
    try {
      // TODO: replace with typed entity-map access when core owns data types.
      // @ts-expect-error Dynamic ZenMoney entity access.
      delete store[obj.object][obj.id]
    } catch (error) {
      console.error('Error deleting object', error, obj)
    }
  })

  keys(patch).forEach(key => {
    if (key === 'deletion' || !patch[key]) return
    const rawKey: string = key
    if (rawKey === 'serverTimestamp') return

    if (!Array.isArray(patch[key])) {
      console.error('Expected array for key', key, 'got', typeof patch[key])
      return
    }

    store[key] ??= {}

    patch[key].forEach(el => {
      try {
        // TODO: replace with typed entity-map access when core owns data types.
        // @ts-expect-error Dynamic ZenMoney entity access.
        store[key][el.id] = { ...store[key][el.id], ...el }
      } catch (error) {
        console.error('Error adding object', error, el)
      }
    })
  })
}
