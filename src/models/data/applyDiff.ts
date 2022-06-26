import { TDataStore, TDiff } from 'shared/types'

/**
 * Mutable method
 * @param diff
 * @param store
 */
export function applyDiff(diff: TDiff, store: TDataStore) {
  const processKey = (key: keyof TDiff) => {
    if (key === 'serverTimestamp' || key === 'deletion') return
    if (diff[key])
      diff[key]?.forEach(el => {
        // @ts-ignore
        // TODO: Need some TS magic to use correct id type here
        store[key][el.id] = el
      })
  }

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
}
