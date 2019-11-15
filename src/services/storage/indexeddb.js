import { openDB, deleteDB } from 'idb'

const baseName = 'zerro_data'
const storeName = 'serverData'
const version = 1

async function getDB() {
  return await openDB(baseName, version, {
    upgrade: db => db.createObjectStore(storeName),
    blocked: () => console.log('DB blocked'),
    blocking: e => e.currentTarget.close(),
  })
}

const indexedDB = {
  set: async (key, value) => {
    const db = await getDB()
    return db.put(storeName, value, key)
  },

  get: async key => {
    const db = await getDB()
    return db.get(storeName, key)
  },

  clear: () =>
    deleteDB(baseName, { blocked: () => console.log('DB not deleted') }),
}

export default indexedDB
