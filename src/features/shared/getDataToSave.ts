import { keys } from '@shared/helpers/keys'
import { RootState } from '@store'
import { IDiff, TLocalData } from '@shared/types'
import { convertDiff } from '@shared/api/zm-adapter'

export const getDataToSave = (state: RootState): TLocalData => {
  const data = state.data.server
  if (!data) return { serverTimestamp: 0 }
  let result: IDiff = { serverTimestamp: 0 }
  keys(data).forEach(key => {
    if (key === 'serverTimestamp') {
      result[key] = data[key]
    } else {
      result[key] = Object.values(data[key])
    }
  })
  return convertDiff.toServer(result)
}
