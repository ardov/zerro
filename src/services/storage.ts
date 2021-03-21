import { openDB, deleteDB } from 'idb'

const BASE_NAME = 'zerro_data'
const STORE_NAME = 'serverData'
const VERSION = 1

export function getIDBStorage(storeName: string) {
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
      deleteDB(BASE_NAME, { blocked: () => console.log('DB not deleted') })
      // const db = await getDB()
      // db.deleteObjectStore(storeName)
    },
  }
}

async function getDB() {
  return await openDB(BASE_NAME, VERSION, {
    upgrade: db => db.createObjectStore(STORE_NAME),
    blocked: () => console.log('DB blocked'),
    blocking: () => console.log('DB blocking'),
  })
}

export const storage = {
  set: async (key: string, value: any) => {
    const db = await getDB()
    return db.put(STORE_NAME, value, key)
  },
  get: async (key: string) => {
    const db = await getDB()
    return db.get(STORE_NAME, key)
  },
  clear: () =>
    deleteDB(BASE_NAME, { blocked: () => console.log('DB not deleted') }),
}
