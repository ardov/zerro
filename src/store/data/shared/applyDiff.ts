import { keys } from '6-shared/helpers/keys'
import { TDiff } from '6-shared/types'
import { TDataStore } from '6-shared/types'

/**
 * Mutable method
 * @param diff
 * @param store
 */
export function applyDiffMutable(diff: TDiff, store: TDataStore) {
  // Update server timestamp
  if (diff.serverTimestamp) store.serverTimestamp = diff.serverTimestamp

  // Delete objects
  if (diff.deletion) {
    diff.deletion.forEach(obj => {
      try {
        // @ts-ignore
        // TODO: Need some TS magic to use correct id type here
        delete store[obj.object][obj.id]
      } catch (error) {
        console.error('Error deleting object', error, obj)
      }
    })
  }

  // Add created or updated objects
  keys(diff).forEach(key => {
    if (key === 'serverTimestamp' || key === 'deletion' || !diff[key]) return
    if (!Array.isArray(diff[key])) {
      console.error('Expected array for key', key, 'got', typeof diff[key])
      return
    }
    if (!store[key]) store[key] = {} // For new objects
    diff[key].forEach(el => {
      try {
        // @ts-ignore
        // TODO: Need some TS magic to use correct id type here
        store[key][el.id] = el
      } catch (error) {
        console.error('Error adding object', error, el)
      }
    })
  })
}
