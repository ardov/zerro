import LocalStorage from 'services/storage/localstorage'
import IndexedDB from 'services/storage/indexeddb'

export default class StorageFactory {
  static create(data) {
    const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if (indexedDB) {
      return IndexedDB
    }

    return LocalStorage
  }
}
