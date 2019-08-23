import LZString from 'lz-string'

const LocalStorage = {}
LocalStorage.set = (key, value) =>
  localStorage.setItem(key, LZString.compress(JSON.stringify(value)))

LocalStorage.get = key =>
  localStorage.getItem(key)
    ? JSON.parse(LZString.decompress(localStorage.getItem(key)))
    : localStorage.getItem(key)

LocalStorage.remove = key => localStorage.removeItem()
LocalStorage.clear = () => localStorage.clear()

export default LocalStorage
