import { openDB } from 'idb'
import { idbBaseName, idbStoreName } from '../config'

const VERSION = 1

export function getIDBStorage(base: string, store: string) {
  // Opened on first use, so that merely importing this module does not
  // require IndexedDB to exist (tests, SSR).
  let dbPromise: ReturnType<typeof openDB> | undefined
  const getDB = () =>
    (dbPromise ??= openDB(base, VERSION, {
      upgrade(db) {
        db.createObjectStore(store)
      },
    }))
  return {
    set: async (key: string, value: any) => {
      return (await getDB()).put(store, value, key)
    },
    get: async (key: string) => {
      return (await getDB()).get(store, key)
    },
    clear: async () => {
      return (await getDB()).clear(store)
    },
  }
}

export const storage = getIDBStorage(idbBaseName, idbStoreName)
