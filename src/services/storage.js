import { openDB, deleteDB } from 'idb'

const BASE_NAME = 'zerro_data'
const STORE_NAME = 'serverData'
const VERSION = 1

if (!window.indexedDB) alert('Локальное сохранение не поддерживается 💩')

async function getDB() {
  return await openDB(BASE_NAME, VERSION, {
    upgrade: db => db.createObjectStore(STORE_NAME),
    blocked: () => console.log('DB blocked'),
    blocking: () => console.log('This tab blocking update'),
  })
}

const storage = {
  set: async (key, value) => {
    const db = await getDB()
    return db.put(STORE_NAME, value, key)
  },
  get: async key => {
    const db = await getDB()
    return db.get(STORE_NAME, key)
  },
  clear: () =>
    deleteDB(BASE_NAME, { blocked: () => console.log('DB not deleted') }),
}

export default storage
