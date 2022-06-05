import { openDB, deleteDB } from 'idb'

const BASE_NAME = 'zerro_data'
const STORE_NAME = 'serverData'
const VERSION = 1

function getIDBStorage(storeName: string) {
  async function getDB() {
    return await openDB(BASE_NAME, VERSION, {
      upgrade: db => db.createObjectStore(storeName),
    })
  }
  return {
    set: async (key: string, value: any) => {
      const db = await getDB()
      return db.put(storeName, value, key)
    },
    get: async (key: string) => {
      const db = await getDB()
      return db.get(storeName, key)
    },
    clear: () => {
      deleteDB(BASE_NAME, {
        blocked: () => console.log('DB not deleted'),
      })
    },
  }
}

export const storage = getIDBStorage(STORE_NAME)
export const dataStorage = getIDBStorage('dataStorage')
