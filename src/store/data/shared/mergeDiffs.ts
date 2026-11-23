import type { TNormalizedPatch } from '@/6-shared/types'

export function immutableMergeDiffs(
  target: TNormalizedPatch,
  diff: TNormalizedPatch
) {
  const result: TNormalizedPatch = { ...target }
  if (diff.serverTimestamp) result.serverTimestamp = diff.serverTimestamp
  if (diff.deletion) {
    if (result.deletion) {
      result.deletion = [...result.deletion, ...diff.deletion]
    } else {
      result.deletion = [...diff.deletion]
    }
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

  return result

  function merge(key: keyof TNormalizedPatch) {
    if (key === 'serverTimestamp' || key === 'deletion') return
    if (!diff[key]) return
    if (result[key]) {
      diff[key]?.forEach((el: any) => {
        const id = el.id
        const filtered = result[key]?.filter((el: any) => id !== el.id) || []
        result[key] = [...filtered, el]
      })
    } else {
      // @ts-expect-error TS can't narrow array type by diff key
      result[key] = [...diff[key]]
    }
  }
}
