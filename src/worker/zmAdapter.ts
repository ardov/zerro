import { keys } from 'helpers/keys'
import { ZmDiff, Diff } from 'types'
import { dataConverters } from './dataConverters'

export function toLocal(zmDiff: ZmDiff): Diff {
  let result: Diff = {}
  keys(zmDiff).forEach(key => {
    switch (key) {
      case 'serverTimestamp':
        result[key] = dataConverters[key].toLocal(zmDiff[key])
        break
      case 'deletion':
        result[key] = zmDiff[key]
        break
      case 'instrument':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      case 'country':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      case 'company':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      case 'user':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      case 'account':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      case 'merchant':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      case 'tag':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      case 'budget':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      case 'reminder':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      case 'reminderMarker':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      case 'transaction':
        result[key] = zmDiff[key]?.map((el: any) =>
          dataConverters[key].toLocal(el)
        )
        break
      default:
        console.warn('Unknown key in diff: ', key)
        break
    }
  })

  return result
}
