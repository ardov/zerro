import { openDB, deleteDB } from 'idb'

const BASE_NAME = 'zerro_data'
const STORE_NAME = 'serverData'
const VERSION = 1

export function getIDBStorage(base: string, store: string) {
  async function getDB() {
    return await openDB(base, VERSION, {
      upgrade: db => db.createObjectStore(store),
    })
  }
  return {
    set: async (key: string, value: any) => {
      const db = await getDB()
      return db.put(store, value, key)
    },
    get: async (key: string) => {
      const db = await getDB()
      return db.get(store, key)
    },
    clear: () => {
      deleteDB(base, {
        blocked: () => console.log('DB not deleted'),
      })
    },
  }
}

export const storage = getIDBStorage(BASE_NAME, STORE_NAME)
export const dataStorage = getIDBStorage(BASE_NAME, 'dataStorage')
