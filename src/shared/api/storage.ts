import { openDB } from 'idb'
import { idbBaseName, idbStoreName } from 'shared/config'

const VERSION = 1

export function getIDBStorage(base: string, store: string) {
  const dbPromise = openDB(base, VERSION, {
    upgrade(db) {
      db.createObjectStore(store)
    },
  })
  return {
    set: async (key: string, value: any) => {
      return (await dbPromise).put(store, value, key)
    },
    get: async (key: string) => {
      return (await dbPromise).get(store, key)
    },
    clear: async () => {
      return (await dbPromise).clear(store)
    },
  }
}

export const storage = getIDBStorage(idbBaseName, idbStoreName)
