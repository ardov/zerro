import { keys } from 'helpers/keys'
import { getBudgetId } from 'store/localData/budgets/getBudgetId'
import { DataStore, ZmDeletionObject, ZmDiff } from 'types'
import { dataConverters } from './dataConverters'
import { WorkerStore } from './store'

export function applyChanges(diff: ZmDiff, store: WorkerStore) {
  const keysToSave: string[] = []
  const diffToSend: ZmDiff = { serverTimestamp: 0 }
  const storePatch: ZmDiff = { serverTimestamp: 0 }

  keys(diff).forEach(key => {
    switch (key) {
      case 'serverTimestamp':
        diffToSend[key] = diff[key]
        storePatch[key] = diff[key]
        keysToSave.push(key)
        break

      case 'deletion':
        // TODO
        break

      case 'budget':
        // TODO
        diff[key]?.forEach(el => {
          const id = getId(key, el)
          const converted = dataConverters[key].toLocal(el)
        })
        break

      default:
        diff[key]?.forEach(el => {
          const id = getId(key, el)
          const converted = dataConverters[key].toLocal(el)
        })
        break
    }
  })
}

function getId(key: string, item: any) {
  if (key === 'budget') return getBudgetId(item)
  return item.id as string
}

function applyDeletion(data: DataStore, deletion: ZmDeletionObject[]) {
  deletion.forEach(obj => {
    // TODO
    // Add timestamp check
    delete data[obj.object][obj.id]
  })
}
