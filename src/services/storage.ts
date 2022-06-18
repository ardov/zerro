import { openDB } from 'idb'

const BASE_NAME = 'zerro_data'
const STORE_NAME = 'serverData'
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

export const storage = getIDBStorage(BASE_NAME, STORE_NAME)
export const dataStorage = getIDBStorage(BASE_NAME, 'dataStorage')
