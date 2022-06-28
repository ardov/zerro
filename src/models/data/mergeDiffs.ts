import { TDiff } from 'models/diff'

/**
 * Adds changes from the second diff to the first diff
 * ⚠️ Mutable method
 * @param target - target object will be mutated
 * @param diff - object with changes
 */
export function mergeDiffs(target: TDiff, diff: TDiff) {
  if (diff.serverTimestamp) target.serverTimestamp = diff.serverTimestamp
  if (diff.deletion) {
    if (target.deletion) target.deletion = target.deletion.concat(diff.deletion)
    else target.deletion = diff.deletion
  }
  merge('instrument')
  merge('country')
  merge('company')
  merge('user')
  merge('account')
  merge('merchant')
  merge('tag')
  merge('budget')
  merge('reminder')
  merge('reminderMarker')
  merge('transaction')

  /**
   * Merges all objects from diff key into target key
   * @param key - all diff keys except serverTimestamp and deletion
   */
  function merge(key: keyof TDiff) {
    if (key === 'serverTimestamp' || key === 'deletion') return
    if (!diff[key]) return
    if (target[key]) {
      diff[key]?.forEach((el: any) => {
        const id = el.id
        // @ts-ignore
        const filtered = target[key]?.filter((el: any) => id !== el.id)
        target[key] = [...filtered, el]
      })
    } else {
      // @ts-ignore
      target[key] = diff[key]
    }
  }
}
