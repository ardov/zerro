import LocalStorage from 'services/storage/localstorage'
import IndexedDB from 'services/storage/indexeddb'

if (!window.indexedDB) alert('Локальное сохранение не поддерживается')
const getStorage = () => {
  if (window.indexedDB) {
    clearOldStorage()
    return IndexedDB
  }

  return LocalStorage
}

export default getStorage()

// clears localStorage keys that was used before
function clearOldStorage() {
  ;[
    'serverTimestamp',
    'instrument',
    'user',
    'merchant',
    'country',
    'company',
    'reminder',
    'reminderMarker',
    'account',
    'tag',
    'budget',
    'transaction',
  ].forEach(key => localStorage.removeItem(key))
}
