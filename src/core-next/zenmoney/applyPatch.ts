import { keys } from '../shared/keys'
import type { TDataStore, TDiff } from './store'

export function applyPatch(base: TDataStore, patch: TDiff): TDataStore {
  const next = cloneDataStore(base)
  applyPatchMutable(next, patch)
  return next
}

export function applyPatchMutable(store: TDataStore, patch: TDiff): void {
  if (patch.serverTimestamp) store.serverTimestamp = patch.serverTimestamp

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
    if (key === 'serverTimestamp' || key === 'deletion' || !patch[key]) return

    if (!Array.isArray(patch[key])) {
      console.error('Expected array for key', key, 'got', typeof patch[key])
      return
    }

    store[key] ??= {}

    patch[key].forEach(el => {
      try {
        // TODO: replace with typed entity-map access when core owns data types.
        // @ts-expect-error Dynamic ZenMoney entity access.
        store[key][el.id] = el
      } catch (error) {
        console.error('Error adding object', error, el)
      }
    })
  })
}

function cloneDataStore(store: TDataStore): TDataStore {
  return {
    serverTimestamp: store.serverTimestamp,
    instrument: { ...store.instrument },
    country: { ...store.country },
    company: { ...store.company },
    user: { ...store.user },
    merchant: { ...store.merchant },
    account: { ...store.account },
    tag: { ...store.tag },
    budget: { ...store.budget },
    reminder: { ...store.reminder },
    reminderMarker: { ...store.reminderMarker },
    transaction: { ...store.transaction },
  }
}
