import { keys } from '@/6-shared/helpers/keys'
import type { RootState } from '@/store'
import type { TNormalizedPatch, TLocalData } from '@/6-shared/types'
import { convertDiff } from '@/6-shared/api/zm-adapter'

export const getDataToSave = (state: RootState): TLocalData => {
  const data = state.data.base
  if (!data) return { serverTimestamp: 0 }
  const result: TNormalizedPatch = { serverTimestamp: 0 }
  keys(data).forEach(key => {
    if (key === 'serverTimestamp') {
      result[key] = data[key]
    } else {
      result[key] = Object.values(data[key])
    }
  })
  return convertDiff.toServer(result)
}
