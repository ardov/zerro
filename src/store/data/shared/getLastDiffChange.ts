import { TDiff, TMsTime } from '@shared/types'

/**
 * Returns last time an item was changed in the diff
 */
export function getLastDiffChange(diff?: TDiff | null): TMsTime {
  if (!diff) return 0
  let lastChange = 0
  Object.values(diff).forEach(array => {
    if (typeof array === 'number') return
    array.forEach(item => {
      let changed = 0
      if ('changed' in item) changed = item.changed
      if ('stamp' in item) changed = item.stamp
      lastChange = Math.max(changed, lastChange)
    })
  })
  return lastChange
}
