import { keys } from 'helpers/keys'
import { getBudgetId } from 'store/localData/budgets/getBudgetId'
import { ZmDiff } from 'types'
import { dataConverters } from './dataConverters'
import { WorkerStore } from './store'

export function applyServerPatch(diff: ZmDiff, store: WorkerStore) {
  const keysToSave = new Set()
  const changedKeys = new Set()
  const frontDiff: ZmDiff = { serverTimestamp: 0 }

  const addToStore = (key: keyof ZmDiff, id: string, element: any) => {
    if (key === 'serverTimestamp' || key === 'deletion') return
    store.serverData[key][id] = element
  }

  keys(diff).forEach(key => {
    switch (key) {
      case 'serverTimestamp':
        frontDiff[key] = diff[key]
        store.serverData[key] = diff[key]
        keysToSave.add(key)
        changedKeys.add(key)
        break

      case 'deletion':
        diff[key]?.forEach(el => {})
        break

      default:
        diff[key]?.forEach((el: any) => {
          const converted = dataConverters[key].toLocal(el)
          const id = getId(key, converted)
          const isApplied = isAlreadyApplied(key, converted, store)

          if (!isApplied) {
            // add to front diff
            if (!frontDiff[key]) frontDiff[key] = []
            // @ts-ignore
            frontDiff[key]?.push(converted)

            // mark key as changed
            changedKeys.add(key)
          }

          // remove from local changes
          if (store.localChanges && key in store.localChanges)
            // @ts-ignore
            delete store.localChanges[key][id]

          // mark key to save
          keysToSave.add(key)

          // apply patch to server
          addToStore(key, getId(key, el), dataConverters[key].toLocal(el))
        })
        break
    }
  })

  console.log('Sync finished', { keysToSave, changedKeys, frontDiff, store })

  // send Front diff

  // save changed domains in DB

  // recalculate derived data
}

function isAlreadyApplied(key: keyof ZmDiff, item: any, store: WorkerStore) {
  return false

  // TODO: support deletion in local changes
  // if (key === 'deletion') return false

  // const id = getId(key, item)
  // if (!store.localChanges?.[key]?.[id]) return false
  // if (store.localChanges[key][id]) return
}

function getId(key: string, item: any) {
  if (key === 'budget') return getBudgetId(item)
  return item.id as string
}
