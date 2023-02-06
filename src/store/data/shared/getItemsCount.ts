import { TDiff } from '@shared/types'

/**
 * Counts all items in a diff object
 */
export function getItemsCount(diff?: TDiff | null): number {
  if (!diff) return 0
  let count = 0
  Object.values(diff).forEach(array => {
    if (typeof array === 'number') return
    count += array.length
  })
  return count
}
