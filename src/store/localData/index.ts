import { RootState } from 'store'
import { getDiff } from 'store/data'

export const getChangedNum = (state: RootState) => {
  const diff = getDiff(state)
  if (!diff) return 0
  return Object.values(diff).reduce((sum, arr) => sum + arr.length, 0)
}

export const getLastChangeTime = (state: RootState) => {
  const diff = getDiff(state)
  if (!diff) return 0
  let lastChange = 0
  Object.values(diff).forEach(array =>
    array.forEach((item: { changed: number; [x: string]: any }) => {
      lastChange = Math.max(item.changed, lastChange)
    })
  )

  return lastChange
}
