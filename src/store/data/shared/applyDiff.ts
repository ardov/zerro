import { TDiff } from '@shared/types'
import { TDataStore } from '@shared/types'

/**
 * Mutable method
 * @param diff
 * @param store
 */
export function applyDiff(diff: TDiff, store: TDataStore) {
  if (diff.serverTimestamp) store.serverTimestamp = diff.serverTimestamp
  diff.deletion?.forEach(obj => {
    // @ts-ignore
    // TODO: Need some TS magic to use correct id type here
    delete store[obj.object][obj.id]
  })
  processKey('instrument')
  processKey('country')
  processKey('company')
  processKey('user')
  processKey('account')
  processKey('merchant')
  processKey('tag')
  processKey('budget')
  processKey('reminder')
  processKey('reminderMarker')
  processKey('transaction')

  function processKey(key: keyof TDiff) {
    if (key === 'serverTimestamp' || key === 'deletion') return
    if (diff[key])
      diff[key]?.forEach(el => {
        // @ts-ignore
        // TODO: Need some TS magic to use correct id type here
        store[key][el.id] = el
      })
  }
}

/**
 * Immutable method
 * @param diff
 * @param store
 */
export function immutableApplyDiff(diff: TDiff, store: TDataStore) {
  const result: TDataStore = { ...store }
  if (diff.serverTimestamp) result.serverTimestamp = diff.serverTimestamp
  diff.deletion?.forEach(obj => {
    // TODO: Need some TS magic to use correct id type here
    // @ts-ignore
    result[obj.object] = { ...store[obj.object] }
    // @ts-ignore
    delete result[obj.object][obj.id]
  })
  processKey('instrument')
  processKey('country')
  processKey('company')
  processKey('user')
  processKey('account')
  processKey('merchant')
  processKey('tag')
  processKey('budget')
  processKey('reminder')
  processKey('reminderMarker')
  processKey('transaction')

  return result

  function processKey(key: keyof TDiff) {
    if (key === 'serverTimestamp' || key === 'deletion') return
    if (diff[key])
      // @ts-ignore
      result[key] = { ...store[key] }
    diff[key]?.forEach(el => {
      // @ts-ignore
      // TODO: Need some TS magic to use correct id type here
      result[key][el.id] = el
    })
  }
}
